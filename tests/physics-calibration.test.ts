import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('Physics calibration baselines', () => {
  it('matches the configured rolling deceleration over a known interval', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const duration = 0.1
    const initialSpeed = 1
    cue.position = { x: 0, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: initialSpeed, z: 0 }
    cue.angularVelocity = { x: 0, y: 0, z: -initialSpeed / cue.radius }

    world.step(duration)

    const expectedSpeed = initialSpeed - world.config.rollingDeceleration * duration
    expect(cue.velocity.x).toBeCloseTo(expectedSpeed, 8)
    expect(cue.velocity.z).toBeCloseTo(0, 8)
    expect(cue.angularVelocity.z).toBeCloseTo(-expectedSpeed / cue.radius, 8)
    const substepCount = Math.ceil(duration / (1 / 120))
    const substepDuration = duration / substepCount
    const expectedDistance = duration * (
      initialSpeed - world.config.rollingDeceleration * substepDuration *
      (substepCount + 1) / 2
    )
    expect(cue.position.x).toBeCloseTo(expectedDistance, 8)
  })

  it('matches the exponential side-spin decay baseline', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const duration = 0.1
    const initialSpin = 12
    cue.position = { x: 0, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.angularVelocity.y = initialSpin

    world.step(duration)

    const expectedSpin = initialSpin * Math.exp(-world.config.sideSpinDecay * duration)
    expect(cue.angularVelocity.y).toBeCloseTo(expectedSpin, 8)
  })

  it('applies the configured Coulomb-limited sliding impulse', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const duration = 1 / 120
    const initialSlip = 1
    cue.position = { x: 0, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: initialSlip, z: 0 }
    cue.angularVelocity = { x: 0, y: 0, z: 0 }

    world.step(duration)

    const inertia = 0.4 * cue.mass * cue.radius * cue.radius
    const impulse = world.config.slidingFriction * cue.mass *
      world.config.gravity * duration
    const expectedSlip = initialSlip - impulse *
      (1 / cue.mass + cue.radius * cue.radius / inertia)
    const actualSlip = cue.velocity.x + cue.radius * cue.angularVelocity.z

    expect(actualSlip).toBeCloseTo(expectedSlip, 8)
    expect(actualSlip).toBeGreaterThan(0)
    expect(cue.velocity.x).toBeLessThan(initialSlip)
  })

  it('preserves linear momentum in a frictionless equal-mass head-on impact', () => {
    const defaults = new PhysicsWorld().config
    const world = new PhysicsWorld({
      ...defaults,
      slidingFriction: 0,
      rollingDeceleration: 0,
      ballCollisionFriction: 0,
    })
    const [a, b] = world.balls
    for (const ball of world.balls) ball.active = false

    a.active = true
    a.position = { x: -0.03, z: 0 }
    a.previousPosition = { ...a.position }
    a.velocity = { x: 1, z: 0 }
    b.active = true
    b.position = { x: 0.03, z: 0 }
    b.previousPosition = { ...b.position }
    b.velocity = { x: 0, z: 0 }

    world.step(1 / 120)

    const momentumBefore = a.mass
    const momentumAfter = a.mass * a.velocity.x + b.mass * b.velocity.x
    expect(momentumAfter).toBeCloseTo(momentumBefore, 8)
    expect(b.velocity.x).toBeGreaterThan(0)
  })
})
