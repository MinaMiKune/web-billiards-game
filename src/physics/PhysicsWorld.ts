export interface Vec2 {
  x: number
  z: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface PocketedBallEvent {
  ballNumber: number
  pocketIndex: number
}

export interface ShotTelemetry {
  firstContactBallNumber: number | null
  pocketedBallNumbers: number[]
  pocketedBallEvents: PocketedBallEvent[]
  cueBallPocketed: boolean
  railContactAfterFirstHit: boolean
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
  pocketedElapsedSeconds: number
  pocketTarget: Vec2 | null
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
  ballCollisionFriction: number
  cushionFriction: number
  ballRestitution: number
  cushionRestitution: number
  pocketCaptureRadius: number
  sidePocketHalfWidth: number
  pocketJawDepth: number
  pocketDropDuration: number
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
  ballCollisionFriction: 0.07,
  cushionFriction: 0.12,
  ballRestitution: 0.96,
  cushionRestitution: 0.88,
  pocketCaptureRadius: 0.098,
  sidePocketHalfWidth: 0.095,
  pocketJawDepth: 0.045,
  pocketDropDuration: 0.42,
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
  pocketed: boolean
  pocketProgress: number
  pocketTarget: Vec2 | null
}

const ZERO_VEC3 = (): Vec3 => ({ x: 0, y: 0, z: 0 })

function momentOfInertia(ball: BallState): number {
  return 0.4 * ball.mass * ball.radius * ball.radius
}

function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

export class PhysicsWorld {
  readonly config: PhysicsConfig
  balls: BallState[]
  private shotTelemetry: ShotTelemetry = this.createEmptyShotTelemetry()

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG) {
    this.config = { ...config }
    this.balls = this.createRack()
  }

  resetRack(): void {
    this.balls = this.createRack()
    this.shotTelemetry = this.createEmptyShotTelemetry()
  }

  getShotTelemetry(): ShotTelemetry {
    return {
      ...this.shotTelemetry,
      pocketedBallNumbers: [...this.shotTelemetry.pocketedBallNumbers],
      pocketedBallEvents: this.shotTelemetry.pocketedBallEvents.map((event) => ({ ...event })),
    }
  }

  clone(): PhysicsWorld {
    const copy = new PhysicsWorld(this.config)
    copy.balls = this.balls.map((ball) => ({
      ...ball,
      position: { ...ball.position },
      previousPosition: { ...ball.previousPosition },
      velocity: { ...ball.velocity },
      angularVelocity: { ...ball.angularVelocity },
      rotation: { ...ball.rotation },
      previousRotation: { ...ball.previousRotation },
      pocketTarget: ball.pocketTarget ? { ...ball.pocketTarget } : null,
    }))
    copy.shotTelemetry = this.getShotTelemetry()
    return copy
  }

  placeCueBall(position: Vec2): boolean {
    if (this.isMoving) return false

    const cue = this.cueBall
    const halfLength = this.config.tableLength / 2
    const halfWidth = this.config.tableWidth / 2
    const xLimit = halfLength - cue.radius
    const zLimit = halfWidth - cue.radius

    if (Math.abs(position.x) > xLimit || Math.abs(position.z) > zLimit) return false

    const nearCornerPocket = [
      { x: -halfLength, z: -halfWidth },
      { x: -halfLength, z: halfWidth },
      { x: halfLength, z: -halfWidth },
      { x: halfLength, z: halfWidth },
    ].some((pocket) =>
      Math.hypot(position.x - pocket.x, position.z - pocket.z) <
      this.config.pocketCaptureRadius + cue.radius,
    )
    const nearSidePocket =
      Math.abs(position.z) > zLimit - cue.radius &&
      Math.abs(position.x) < this.config.sidePocketHalfWidth + cue.radius
    if (nearCornerPocket || nearSidePocket) return false

    const overlapsBall = this.balls.some((ball) => {
      if (!ball.active || ball.number === cue.number) return false
      const distance = Math.hypot(
        position.x - ball.position.x,
        position.z - ball.position.z,
      )
      return distance < cue.radius + ball.radius + 0.001
    })
    if (overlapsBall) return false

    cue.position = { ...position }
    cue.previousPosition = { ...position }
    cue.velocity = { x: 0, z: 0 }
    cue.angularVelocity = ZERO_VEC3()
    cue.rotation = ZERO_VEC3()
    cue.previousRotation = ZERO_VEC3()
    cue.active = true
    cue.pocketed = false
    cue.pocketedElapsedSeconds = 0
    cue.pocketTarget = null
    return true
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
      const rollSpinSpeed = Math.hypot(ball.angularVelocity.x, ball.angularVelocity.z) * ball.radius
      return linearSpeed > this.config.stopSpeed ||
        rollSpinSpeed > this.config.stopSpeed ||
        Math.abs(ball.angularVelocity.y) > this.config.spinStopSpeed
    })
  }

  shootCueBall(direction: Vec2, power: number, spin: BallSpin = { side: 0, vertical: 0 }): boolean {
    if (this.isMoving || !this.cueBall.active) return false

    const length = Math.hypot(direction.x, direction.z)
    const strength = Math.max(0, Math.min(1, power))
    if (length < 1e-6 || strength <= 0) return false

    this.shotTelemetry = this.createEmptyShotTelemetry()
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
      if (ball.pocketed) {
        ball.pocketedElapsedSeconds = Math.min(
          this.config.pocketDropDuration,
          ball.pocketedElapsedSeconds + deltaSeconds,
        )
        continue
      }
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
      pocketed: ball.pocketed,
      pocketProgress: ball.pocketed
        ? Math.max(0, Math.min(1, ball.pocketedElapsedSeconds / this.config.pocketDropDuration))
        : 0,
      pocketTarget: ball.pocketTarget ? { ...ball.pocketTarget } : null,
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

  private createEmptyShotTelemetry(): ShotTelemetry {
    return {
      firstContactBallNumber: null,
      pocketedBallNumbers: [],
      pocketedBallEvents: [],
      cueBallPocketed: false,
      railContactAfterFirstHit: false,
    }
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
      pocketedElapsedSeconds: 0,
      pocketTarget: null,
    })

    const balls: BallState[] = [
      createBall('cue', 0, '#f4f1e8', { x: -0.72, z: 0 }),
    ]
    const spacing = radius * 2.04
    const rackStartX = 0.48
    // Standard 8-ball rack: the 8 sits in the center and the rear corners
    // contain one solid and one stripe.
    const rackNumbers = [
      [1],
      [9, 2],
      [3, 8, 10],
      [11, 4, 12, 5],
      [6, 13, 7, 14, 15],
    ]

    for (let row = 0; row < rackNumbers.length; row += 1) {
      for (let column = 0; column < rackNumbers[row].length; column += 1) {
        const number = rackNumbers[row][column]
        const position = {
          x: rackStartX + row * spacing * Math.sqrt(3) / 2,
          z: (column - row / 2) * spacing,
        }
        balls.push(createBall('ball-' + number, number, BALL_COLORS[number - 1], position))
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
      const cornerPocketIndex = cornerPockets.findIndex((pocket) =>
        Math.hypot(ball.position.x - pocket.x, ball.position.z - pocket.z) <=
        this.config.pocketCaptureRadius,
      )
      const cornerPocket = cornerPocketIndex >= 0 ? cornerPockets[cornerPocketIndex] : null
      const sidePocketCaptured =
        crossedZBoundary &&
        Math.abs(ball.position.x) <= this.config.sidePocketHalfWidth

      if (cornerPocket || sidePocketCaptured) {
        ball.active = false
        ball.pocketed = true
        ball.pocketedElapsedSeconds = 0
        ball.pocketTarget = cornerPocket
          ? { x: cornerPocket.x, z: cornerPocket.z }
          : { x: 0, z: Math.sign(ball.position.z || 1) * halfWidth }
        ball.velocity = { x: 0, z: 0 }
        ball.angularVelocity = ZERO_VEC3()
        if (!this.shotTelemetry.pocketedBallNumbers.includes(ball.number)) {
          this.shotTelemetry.pocketedBallNumbers.push(ball.number)
          const cornerPocketIndices = [0, 3, 2, 5]
          const pocketIndex = cornerPocketIndex >= 0
            ? cornerPocketIndices[cornerPocketIndex]
            : ball.position.z < 0 ? 1 : 4
          this.shotTelemetry.pocketedBallEvents.push({
            ballNumber: ball.number,
            pocketIndex,
          })
        }
        if (ball.number === 0) this.shotTelemetry.cueBallPocketed = true
        return
      }
    }

    this.resolvePocketJawImpacts(ball, halfLength, halfWidth)

    if (ball.position.x > xLimit) {
      ball.position.x = xLimit
      this.resolveCushionImpact(ball, { x: -1, z: 0 })
    } else if (ball.position.x < -xLimit) {
      ball.position.x = -xLimit
      this.resolveCushionImpact(ball, { x: 1, z: 0 })
    }

    if (ball.position.z > zLimit) {
      ball.position.z = zLimit
      this.resolveCushionImpact(ball, { x: 0, z: -1 })
    } else if (ball.position.z < -zLimit) {
      ball.position.z = -zLimit
      this.resolveCushionImpact(ball, { x: 0, z: 1 })
    }
  }

  private resolvePocketJawImpacts(
    ball: BallState,
    halfLength: number,
    halfWidth: number,
  ): void {
    const jawDepth = Math.max(0, this.config.pocketJawDepth)
    const cornerMouthRadius = this.config.pocketCaptureRadius
    const innerCornerOffset = Math.max(0, cornerMouthRadius - jawDepth)

    for (const xSign of [-1, 1]) {
      for (const zSign of [-1, 1]) {
        const pocket = { x: xSign * halfLength, z: zSign * halfWidth }
        const pocketDistance = Math.hypot(
          ball.position.x - pocket.x,
          ball.position.z - pocket.z,
        )
        if (pocketDistance <= cornerMouthRadius) continue

        const innerTip = {
          x: xSign * (halfLength - innerCornerOffset),
          z: zSign * (halfWidth - innerCornerOffset),
        }
        const longRailJawStart = {
          x: xSign * (halfLength - cornerMouthRadius),
          z: zSign * halfWidth,
        }
        const endRailJawStart = {
          x: xSign * halfLength,
          z: zSign * (halfWidth - cornerMouthRadius),
        }

        if (this.resolveSegmentCushionImpact(ball, longRailJawStart, innerTip)) return
        if (this.resolveSegmentCushionImpact(ball, endRailJawStart, innerTip)) return
      }
    }

    const sideJawInnerX = this.config.sidePocketHalfWidth + ball.radius
    for (const zSign of [-1, 1]) {
      for (const xSign of [-1, 1]) {
        const jawStart = {
          x: xSign * sideJawInnerX,
          z: zSign * (halfWidth - jawDepth),
        }
        const jawEnd = {
          x: xSign * (sideJawInnerX + jawDepth),
          z: zSign * halfWidth,
        }
        if (this.resolveSegmentCushionImpact(ball, jawStart, jawEnd)) return
      }
    }
  }

  private resolveSegmentCushionImpact(
    ball: BallState,
    start: Vec2,
    end: Vec2,
  ): boolean {
    const segmentX = end.x - start.x
    const segmentZ = end.z - start.z
    const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ
    if (segmentLengthSquared <= 1e-12) return false

    const projection = Math.max(0, Math.min(1,
      ((ball.position.x - start.x) * segmentX +
        (ball.position.z - start.z) * segmentZ) / segmentLengthSquared,
    ))
    const closestX = start.x + projection * segmentX
    const closestZ = start.z + projection * segmentZ
    const differenceX = ball.position.x - closestX
    const differenceZ = ball.position.z - closestZ
    const distanceSquared = differenceX * differenceX + differenceZ * differenceZ
    const radiusSquared = ball.radius * ball.radius
    if (distanceSquared >= radiusSquared) return false

    const segmentLength = Math.sqrt(segmentLengthSquared)
    let normal: Vec2
    if (distanceSquared > 1e-12) {
      const distance = Math.sqrt(distanceSquared)
      normal = { x: differenceX / distance, z: differenceZ / distance }
    } else {
      normal = { x: -segmentZ / segmentLength, z: segmentX / segmentLength }
    }

    // The playable side of every rail/jaw points toward the table center.
    if (normal.x * -closestX + normal.z * -closestZ < 0) {
      normal = { x: -normal.x, z: -normal.z }
    }

    const distance = Math.sqrt(distanceSquared)
    const penetration = ball.radius - distance
    ball.position.x += normal.x * penetration
    ball.position.z += normal.z * penetration

    const normalSpeed = ball.velocity.x * normal.x + ball.velocity.z * normal.z
    if (normalSpeed < -1e-8) this.resolveCushionImpact(ball, normal)
    return true
  }

  private resolveCushionImpact(ball: BallState, normal: Vec2): void {
    const normalSpeed = ball.velocity.x * normal.x + ball.velocity.z * normal.z
    if (normalSpeed >= 0) return

    const normalImpulse = (1 + this.config.cushionRestitution) *
      ball.mass * -normalSpeed
    if (this.shotTelemetry.firstContactBallNumber !== null) {
      this.shotTelemetry.railContactAfterFirstHit = true
    }

    ball.velocity.x -= (1 + this.config.cushionRestitution) * normalSpeed * normal.x
    ball.velocity.z -= (1 + this.config.cushionRestitution) * normalSpeed * normal.z

    const inertia = momentOfInertia(ball)
    const effectiveInverseMass = (1 / ball.mass) +
      (ball.radius * ball.radius / inertia)
    const tangent = { x: -normal.z, z: normal.x }
    const tangentialSlip = ball.velocity.x * tangent.x +
      ball.velocity.z * tangent.z + ball.angularVelocity.y * ball.radius
    const requestedImpulse = -tangentialSlip / effectiveInverseMass
    const maximumImpulse = this.config.cushionFriction * normalImpulse
    const tangentImpulse = Math.max(-maximumImpulse, Math.min(maximumImpulse, requestedImpulse))

    ball.velocity.x += tangent.x * tangentImpulse / ball.mass
    ball.velocity.z += tangent.z * tangentImpulse / ball.mass
    ball.angularVelocity.y += ball.radius * tangentImpulse / inertia
  }

  private applyBallContactFriction(
    a: BallState,
    b: BallState,
    normal: Vec2,
    normalImpulse: number,
  ): void {
    const radiusA = a.radius
    const radiusB = b.radius
    const inertiaA = momentOfInertia(a)
    const inertiaB = momentOfInertia(b)
    const armA: Vec3 = { x: normal.x * radiusA, y: 0, z: normal.z * radiusA }
    const armB: Vec3 = { x: -normal.x * radiusB, y: 0, z: -normal.z * radiusB }
    const surfaceA = crossProduct(a.angularVelocity, armA)
    const surfaceB = crossProduct(b.angularVelocity, armB)

    const relativeX = (b.velocity.x + surfaceB.x) - (a.velocity.x + surfaceA.x)
    const relativeY = surfaceB.y - surfaceA.y
    const relativeZ = (b.velocity.z + surfaceB.z) - (a.velocity.z + surfaceA.z)
    const tangent: Vec2 = { x: -normal.z, z: normal.x }
    const tangentialSlip = relativeX * tangent.x + relativeZ * tangent.z

    const effectiveInverseMass =
      (1 / a.mass) + (1 / b.mass) +
      (radiusA * radiusA / inertiaA) +
      (radiusB * radiusB / inertiaB)

    let impulseTangent = -tangentialSlip / effectiveInverseMass
    let impulseVertical = -relativeY / effectiveInverseMass
    const requestedMagnitude = Math.hypot(impulseTangent, impulseVertical)
    const maximumMagnitude = this.config.ballCollisionFriction * normalImpulse

    if (requestedMagnitude > maximumMagnitude && requestedMagnitude > 0) {
      const scale = maximumMagnitude / requestedMagnitude
      impulseTangent *= scale
      impulseVertical *= scale
    }

    const impulse: Vec3 = {
      x: tangent.x * impulseTangent,
      y: impulseVertical,
      z: tangent.z * impulseTangent,
    }

    a.velocity.x -= impulse.x / a.mass
    a.velocity.z -= impulse.z / a.mass
    b.velocity.x += impulse.x / b.mass
    b.velocity.z += impulse.z / b.mass

    const torqueA = crossProduct(armA, impulse)
    const torqueB = crossProduct(armB, impulse)
    a.angularVelocity.x -= torqueA.x / inertiaA
    a.angularVelocity.y -= torqueA.y / inertiaA
    a.angularVelocity.z -= torqueA.z / inertiaA
    b.angularVelocity.x += torqueB.x / inertiaB
    b.angularVelocity.y += torqueB.y / inertiaB
    b.angularVelocity.z += torqueB.z / inertiaB
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

        if (this.shotTelemetry.firstContactBallNumber === null) {
          if (a.number === 0 && b.number !== 0) {
            this.shotTelemetry.firstContactBallNumber = b.number
          } else if (b.number === 0 && a.number !== 0) {
            this.shotTelemetry.firstContactBallNumber = a.number
          }
        }

        const impulse = -((1 + this.config.ballRestitution) * relativeNormalSpeed) /
          ((1 / a.mass) + (1 / b.mass))

        a.velocity.x -= (impulse / a.mass) * normal.x
        a.velocity.z -= (impulse / a.mass) * normal.z
        b.velocity.x += (impulse / b.mass) * normal.x
        b.velocity.z += (impulse / b.mass) * normal.z
        this.applyBallContactFriction(a, b, normal, impulse)
      }
    }
  }
}
