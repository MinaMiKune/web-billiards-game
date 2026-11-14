export interface Vec2 {
  x: number
  z: number
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
  active: boolean
  pocketed: boolean
}

export interface PhysicsConfig {
  tableLength: number
  tableWidth: number
  ballRadius: number
  ballMass: number
  rollingDeceleration: number
  ballRestitution: number
  cushionRestitution: number
  stopSpeed: number
  maxShotSpeed: number
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  tableLength: 2.54,
  tableWidth: 1.27,
  ballRadius: 0.028575,
  ballMass: 0.17,
  rollingDeceleration: 0.28,
  ballRestitution: 0.96,
  cushionRestitution: 0.88,
  stopSpeed: 0.008,
  maxShotSpeed: 4.8,
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
  active: boolean
}

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
    return this.balls.some((ball) =>
      ball.active && Math.hypot(ball.velocity.x, ball.velocity.z) > this.config.stopSpeed,
    )
  }

  shootCueBall(direction: Vec2, power: number): boolean {
    if (this.isMoving || !this.cueBall.active) return false

    const length = Math.hypot(direction.x, direction.z)
    const strength = Math.max(0, Math.min(1, power))
    if (length < 1e-6 || strength <= 0) return false

    const speed = strength * this.config.maxShotSpeed
    this.cueBall.velocity = {
      x: (direction.x / length) * speed,
      z: (direction.z / length) * speed,
    }
    return true
  }

  step(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return

    for (const ball of this.balls) {
      ball.previousPosition = { ...ball.position }
      if (!ball.active) continue

      const speed = Math.hypot(ball.velocity.x, ball.velocity.z)
      const speedLoss = this.config.rollingDeceleration * deltaSeconds
      if (speed <= Math.max(speedLoss, this.config.stopSpeed)) {
        ball.velocity = { x: 0, z: 0 }
      } else {
        const scale = (speed - speedLoss) / speed
        ball.velocity.x *= scale
        ball.velocity.z *= scale
      }

      ball.position.x += ball.velocity.x * deltaSeconds
      ball.position.z += ball.velocity.z * deltaSeconds
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
    }))
  }

  private createRack(): BallState[] {
    const radius = this.config.ballRadius
    const cue: BallState = {
      id: 'cue',
      number: 0,
      color: '#f4f1e8',
      radius,
      mass: this.config.ballMass,
      position: { x: -0.72, z: 0 },
      previousPosition: { x: -0.72, z: 0 },
      velocity: { x: 0, z: 0 },
      active: true,
      pocketed: false,
    }

    const balls: BallState[] = [cue]
    const spacing = radius * 2.04
    const rackStartX = 0.48
    let number = 1

    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column <= row; column += 1) {
        const position = {
          x: rackStartX + row * spacing * Math.sqrt(3) / 2,
          z: (column - row / 2) * spacing,
        }
        balls.push({
          id: 'ball-' + number,
          number,
          color: BALL_COLORS[number - 1],
          radius,
          mass: this.config.ballMass,
          position,
          previousPosition: { ...position },
          velocity: { x: 0, z: 0 },
          active: true,
          pocketed: false,
        })
        number += 1
      }
    }
    return balls
  }

  private resolvePocketAndCushion(ball: BallState): void {
    const halfLength = this.config.tableLength / 2
    const halfWidth = this.config.tableWidth / 2
    const radius = ball.radius
    const nearCornerPocket =
      Math.abs(ball.position.x) > halfLength - 0.14 &&
      Math.abs(ball.position.z) > halfWidth - 0.14
    const nearSidePocket =
      Math.abs(ball.position.z) > halfWidth - 0.12 &&
      Math.abs(ball.position.x) < 0.085

    if (nearCornerPocket || nearSidePocket) {
      ball.active = false
      ball.pocketed = true
      ball.velocity = { x: 0, z: 0 }
      return
    }

    const xLimit = halfLength - radius
    const zLimit = halfWidth - radius

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
