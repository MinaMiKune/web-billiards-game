export interface Vec2 {
  x: number
  z: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface BallSpin {
  side: number
  vertical: number
}

export interface BallState {
  id: string
  number: number
  color: string
  radius: number
  mass: number
  position: Vec2
  previousPosition: Vec2
  velocity: Vec2
  angularVelocity: Vec3
  rotation: Vec3
  previousRotation: Vec3
  active: boolean
  pocketed: boolean
}

export interface PhysicsConfig {
  tableLength: number
  tableWidth: number
  ballRadius: number
  ballMass: number
  gravity: number
  slidingFriction: number
  rollingDeceleration: number
  sideSpinDecay: number
  rollingSlipThreshold: number
  spinStopSpeed: number
  verticalSpinRatio: number
  maxSideSpin: number
  ballRestitution: number
  cushionRestitution: number
  pocketCaptureRadius: number
  sidePocketHalfWidth: number
  stopSpeed: number
  maxShotSpeed: number
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  tableLength: 2.54,
  tableWidth: 1.27,
  ballRadius: 0.028575,
  ballMass: 0.17,
  gravity: 9.81,
  slidingFriction: 0.2,
  rollingDeceleration: 0.32,
  sideSpinDecay: 2.2,
  rollingSlipThreshold: 0.025,
  spinStopSpeed: 0.25,
  verticalSpinRatio: 0.7,
  maxSideSpin: 30,
  ballRestitution: 0.96,
  cushionRestitution: 0.88,
  pocketCaptureRadius: 0.098,
  sidePocketHalfWidth: 0.095,
  stopSpeed: 0.008,
  maxShotSpeed: 2.8,
}

const BALL_COLORS = [
  '#f2ca35', '#2878c8', '#d94d43', '#7447a5', '#e89436',
  '#2b9564', '#9a344f', '#181818', '#f2ca35', '#2878c8',
  '#d94d43', '#7447a5', '#e89436', '#2b9564', '#9a344f',
]

export interface RenderBall {
  id: string
  number: number
  color: string
  radius: number
  position: Vec2
  rotation: Vec3
  active: boolean
}

const ZERO_VEC3 = (): Vec3 => ({ x: 0, y: 0, z: 0 })

export class PhysicsWorld {
  readonly config: PhysicsConfig
  balls: BallState[]

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG) {
    this.config = { ...config }
    this.balls = this.createRack()
  }

  resetRack(): void {
    this.balls = this.createRack()
  }

  get cueBall(): BallState {
    const cueBall = this.balls.find((ball) => ball.number === 0)
    if (!cueBall) throw new Error('Cue ball is missing from the rack')
    return cueBall
  }

  get isMoving(): boolean {
    return this.balls.some((ball) => {
      if (!ball.active) return false
      const linearSpeed = Math.hypot(ball.velocity.x, ball.velocity.z)
      return linearSpeed > this.config.stopSpeed ||
        Math.abs(ball.angularVelocity.y) > this.config.spinStopSpeed
    })
  }

  shootCueBall(direction: Vec2, power: number, spin: BallSpin = { side: 0, vertical: 0 }): boolean {
    if (this.isMoving || !this.cueBall.active) return false

    const length = Math.hypot(direction.x, direction.z)
    const strength = Math.max(0, Math.min(1, power))
    if (length < 1e-6 || strength <= 0) return false

    const unit = { x: direction.x / length, z: direction.z / length }
    const speed = strength * this.config.maxShotSpeed
    const side = Math.max(-1, Math.min(1, spin.side))
    const vertical = Math.max(-1, Math.min(1, spin.vertical))
    const verticalSpin = (speed / this.cueBall.radius) *
      vertical * this.config.verticalSpinRatio

    this.cueBall.velocity = {
      x: unit.x * speed,
      z: unit.z * speed,
    }
    // Positive vertical input is follow/top spin. The rolling axis is up × travel direction.
    this.cueBall.angularVelocity = {
      x: unit.z * verticalSpin,
      y: side * this.config.maxSideSpin * strength,
      z: -unit.x * verticalSpin,
    }
    return true
  }

  step(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return

    for (const ball of this.balls) {
      ball.previousPosition = { ...ball.position }
      ball.previousRotation = { ...ball.rotation }
      if (!ball.active) continue

      this.applyClothFriction(ball, deltaSeconds)
      ball.position.x += ball.velocity.x * deltaSeconds
      ball.position.z += ball.velocity.z * deltaSeconds
      ball.rotation.x += ball.angularVelocity.x * deltaSeconds
      ball.rotation.y += ball.angularVelocity.y * deltaSeconds
      ball.rotation.z += ball.angularVelocity.z * deltaSeconds
      this.resolvePocketAndCushion(ball)
    }

    for (let iteration = 0; iteration < 2; iteration += 1) {
      this.resolveBallCollisions()
    }
  }

  getRenderBalls(alpha: number): RenderBall[] {
    const blend = Math.max(0, Math.min(1, alpha))
    return this.balls.map((ball) => ({
      id: ball.id,
      number: ball.number,
      color: ball.color,
      radius: ball.radius,
      active: ball.active,
      position: {
        x: ball.previousPosition.x + (ball.position.x - ball.previousPosition.x) * blend,
        z: ball.previousPosition.z + (ball.position.z - ball.previousPosition.z) * blend,
      },
      rotation: {
        x: ball.previousRotation.x + (ball.rotation.x - ball.previousRotation.x) * blend,
        y: ball.previousRotation.y + (ball.rotation.y - ball.previousRotation.y) * blend,
        z: ball.previousRotation.z + (ball.rotation.z - ball.previousRotation.z) * blend,
      },
    }))
  }

  private createRack(): BallState[] {
    const radius = this.config.ballRadius
    const createBall = (
      id: string,
      number: number,
      color: string,
      position: Vec2,
    ): BallState => ({
      id,
      number,
      color,
      radius,
      mass: this.config.ballMass,
      position,
      previousPosition: { ...position },
      velocity: { x: 0, z: 0 },
      angularVelocity: ZERO_VEC3(),
      rotation: ZERO_VEC3(),
      previousRotation: ZERO_VEC3(),
      active: true,
      pocketed: false,
    })

    const balls: BallState[] = [
      createBall('cue', 0, '#f4f1e8', { x: -0.72, z: 0 }),
    ]
    const spacing = radius * 2.04
    const rackStartX = 0.48
    let number = 1

    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column <= row; column += 1) {
        const position = {
          x: rackStartX + row * spacing * Math.sqrt(3) / 2,
          z: (column - row / 2) * spacing,
        }
        balls.push(createBall('ball-' + number, number, BALL_COLORS[number - 1], position))
        number += 1
      }
    }
    return balls
  }

  private applyClothFriction(ball: BallState, deltaSeconds: number): void {
    const radius = ball.radius
    const inertia = 0.4 * ball.mass * radius * radius
    // Velocity of the cloth-contact point: v + omega × (0, -r, 0).
    const slipX = ball.velocity.x + radius * ball.angularVelocity.z
    const slipZ = ball.velocity.z - radius * ball.angularVelocity.x
    const slipSpeed = Math.hypot(slipX, slipZ)

    if (slipSpeed > this.config.rollingSlipThreshold) {
      const maximumImpulse = this.config.slidingFriction * ball.mass *
        this.config.gravity * deltaSeconds
      const impulseToStopSlip = slipSpeed / ((1 / ball.mass) + (radius * radius / inertia))
      const impulseMagnitude = Math.min(maximumImpulse, impulseToStopSlip)
      const impulseX = -(slipX / slipSpeed) * impulseMagnitude
      const impulseZ = -(slipZ / slipSpeed) * impulseMagnitude

      ball.velocity.x += impulseX / ball.mass
      ball.velocity.z += impulseZ / ball.mass
      // Torque from the contact impulse about the sphere center.
      ball.angularVelocity.x += (-radius * impulseZ) / inertia
      ball.angularVelocity.z += (radius * impulseX) / inertia
    } else {
      const speed = Math.hypot(ball.velocity.x, ball.velocity.z)
      const speedLoss = this.config.rollingDeceleration * deltaSeconds
      if (speed <= Math.max(speedLoss, this.config.stopSpeed)) {
        ball.velocity = { x: 0, z: 0 }
        ball.angularVelocity.x = 0
        ball.angularVelocity.z = 0
      } else {
        const scale = (speed - speedLoss) / speed
        ball.velocity.x *= scale
        ball.velocity.z *= scale
        // Enforce the no-slip rolling condition after rolling resistance.
        ball.angularVelocity.x = ball.velocity.z / radius
        ball.angularVelocity.z = -ball.velocity.x / radius
      }
    }

    ball.angularVelocity.y *= Math.exp(-this.config.sideSpinDecay * deltaSeconds)
    if (Math.abs(ball.angularVelocity.y) < this.config.spinStopSpeed * 0.05) {
      ball.angularVelocity.y = 0
    }
  }

  private resolvePocketAndCushion(ball: BallState): void {
    const halfLength = this.config.tableLength / 2
    const halfWidth = this.config.tableWidth / 2
    const xLimit = halfLength - ball.radius
    const zLimit = halfWidth - ball.radius
    const cornerPockets = [
      { x: -halfLength, z: -halfWidth },
      { x: -halfLength, z: halfWidth },
      { x: halfLength, z: -halfWidth },
      { x: halfLength, z: halfWidth },
    ]

    const crossedXBoundary = Math.abs(ball.position.x) >= xLimit
    const crossedZBoundary = Math.abs(ball.position.z) >= zLimit

    if (crossedXBoundary || crossedZBoundary) {
      const cornerCaptured = cornerPockets.some((pocket) =>
        Math.hypot(ball.position.x - pocket.x, ball.position.z - pocket.z) <=
        this.config.pocketCaptureRadius,
      )
      const sidePocketCaptured =
        crossedZBoundary &&
        Math.abs(ball.position.x) <= this.config.sidePocketHalfWidth

      if (cornerCaptured || sidePocketCaptured) {
        ball.active = false
        ball.pocketed = true
        ball.velocity = { x: 0, z: 0 }
        ball.angularVelocity = ZERO_VEC3()
        return
      }
    }

    if (ball.position.x > xLimit) {
      ball.position.x = xLimit
      ball.velocity.x = -Math.abs(ball.velocity.x) * this.config.cushionRestitution
    } else if (ball.position.x < -xLimit) {
      ball.position.x = -xLimit
      ball.velocity.x = Math.abs(ball.velocity.x) * this.config.cushionRestitution
    }

    if (ball.position.z > zLimit) {
      ball.position.z = zLimit
      ball.velocity.z = -Math.abs(ball.velocity.z) * this.config.cushionRestitution
    } else if (ball.position.z < -zLimit) {
      ball.position.z = -zLimit
      ball.velocity.z = Math.abs(ball.velocity.z) * this.config.cushionRestitution
    }
  }

  private resolveBallCollisions(): void {
    for (let i = 0; i < this.balls.length; i += 1) {
      const a = this.balls[i]
      if (!a.active) continue

      for (let j = i + 1; j < this.balls.length; j += 1) {
        const b = this.balls[j]
        if (!b.active) continue

        const dx = b.position.x - a.position.x
        const dz = b.position.z - a.position.z
        const distance = Math.hypot(dx, dz)
        const minimumDistance = a.radius + b.radius
        if (distance >= minimumDistance) continue

        const normal = distance > 1e-8
          ? { x: dx / distance, z: dz / distance }
          : { x: 1, z: 0 }
        const overlap = minimumDistance - distance
        const totalMass = a.mass + b.mass

        a.position.x -= normal.x * overlap * (b.mass / totalMass)
        a.position.z -= normal.z * overlap * (b.mass / totalMass)
        b.position.x += normal.x * overlap * (a.mass / totalMass)
        b.position.z += normal.z * overlap * (a.mass / totalMass)

        const relativeNormalSpeed =
          (b.velocity.x - a.velocity.x) * normal.x +
          (b.velocity.z - a.velocity.z) * normal.z

        if (relativeNormalSpeed >= 0) continue

        const impulse = -((1 + this.config.ballRestitution) * relativeNormalSpeed) /
          ((1 / a.mass) + (1 / b.mass))

        a.velocity.x -= (impulse / a.mass) * normal.x
        a.velocity.z -= (impulse / a.mass) * normal.z
        b.velocity.x += (impulse / b.mass) * normal.x
        b.velocity.z += (impulse / b.mass) * normal.z
      }
    }
  }
}
