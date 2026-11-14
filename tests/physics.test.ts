import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

const STEP = 1 / 120

describe('PhysicsWorld', () => {
  it('keeps a stationary cue ball stationary', () => {
    const world = new PhysicsWorld()
    const start = { ...world.cueBall.position }

    for (let i = 0; i < 120; i += 1) world.step(STEP)

    expect(world.cueBall.position.x).toBeCloseTo(start.x, 8)
    expect(world.cueBall.position.z).toBeCloseTo(start.z, 8)
  })

  it('converts sliding motion toward rolling through cloth friction', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    cue.velocity = { x: 1, z: 0 }

    world.step(STEP)

    expect(cue.velocity.x).toBeLessThan(1)
    expect(cue.angularVelocity.z).toBeLessThan(0)
    expect(cue.rotation.z).toBeLessThan(0)
  })

  it('maintains the no-slip condition when the ball is already rolling', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    cue.velocity = { x: 1, z: 0 }
    cue.angularVelocity.z = -1 / cue.radius

    world.step(STEP)

    const contactSlip = cue.velocity.x + cue.radius * cue.angularVelocity.z
    expect(Math.abs(contactSlip)).toBeLessThan(1e-8)
    expect(cue.velocity.x).toBeLessThan(1)
  })

  it('applies follow and draw spin from the cue contact point', () => {
    const followWorld = new PhysicsWorld()
    const drawWorld = new PhysicsWorld()

    followWorld.shootCueBall({ x: 1, z: 0 }, 0.7, { side: 0, vertical: 1 })
    drawWorld.shootCueBall({ x: 1, z: 0 }, 0.7, { side: 0, vertical: -1 })

    expect(followWorld.cueBall.angularVelocity.z).toBeLessThan(0)
    expect(drawWorld.cueBall.angularVelocity.z).toBeGreaterThan(0)
  })

  it('applies and gradually dissipates side spin', () => {
    const world = new PhysicsWorld()
    world.shootCueBall({ x: 1, z: 0 }, 0.7, { side: 1, vertical: 0 })
    const initialSideSpin = world.cueBall.angularVelocity.y

    world.step(0.1)

    expect(initialSideSpin).toBeGreaterThan(0)
    expect(world.cueBall.angularVelocity.y).toBeGreaterThan(0)
    expect(world.cueBall.angularVelocity.y).toBeLessThan(initialSideSpin)
  })

  it('transfers most of the normal velocity in a head-on equal-mass collision', () => {
    const world = new PhysicsWorld()
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

    world.step(STEP)

    expect(a.velocity.x).toBeLessThan(0.1)
    expect(b.velocity.x).toBeGreaterThan(0.8)
    expect(Math.abs(a.velocity.z)).toBeLessThan(1e-8)
    expect(Math.abs(b.velocity.z)).toBeLessThan(1e-8)
  })

  it('reflects a ball from the straight cushion', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const limit = world.config.tableLength / 2 - cue.radius
    cue.position = { x: limit - 0.001, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1, z: 0 }

    world.step(STEP)

    expect(cue.position.x).toBe(limit)
    expect(cue.velocity.x).toBeLessThan(0)
  })

  it('captures a ball in a middle side pocket', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const zLimit = world.config.tableWidth / 2 - cue.radius
    cue.position = { x: 0.2, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    expect(cue.pocketed).toBe(true)
    expect(cue.active).toBe(false)
  })

  it('captures a ball in a corner pocket opening', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const xLimit = world.config.tableLength / 2 - cue.radius
    const zLimit = world.config.tableWidth / 2 - cue.radius
    cue.position = { x: xLimit - 0.001, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1, z: 1 }

    world.step(STEP)

    expect(cue.pocketed).toBe(true)
    expect(cue.active).toBe(false)
  })

  it('treats a ball outside the side-pocket mouth as a cushion hit', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const zLimit = world.config.tableWidth / 2 - cue.radius
    cue.position = { x: world.config.sidePocketHalfWidth + 0.025, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    expect(cue.pocketed).toBe(false)
    expect(cue.active).toBe(true)
    expect(cue.position.z).toBe(zLimit)
    expect(cue.velocity.z).toBeLessThan(0)
  })

  it('transfers side spin into a small throw during ball contact', () => {
    const world = new PhysicsWorld()
    const [cue, target] = world.balls
    for (const ball of world.balls) ball.active = false

    cue.active = true
    cue.position = { x: -0.03, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1, z: 0 }
    cue.angularVelocity.y = 30

    target.active = true
    target.position = { x: 0.03, z: 0 }
    target.previousPosition = { ...target.position }
    target.velocity = { x: 0, z: 0 }

    world.step(STEP)

    expect(Math.abs(target.velocity.z)).toBeGreaterThan(0.02)
    expect(cue.angularVelocity.y).toBeLessThan(30)
    expect(Math.abs(target.angularVelocity.y)).toBeGreaterThan(0)
  })

  it('converts side spin into a tangential rebound from the cushion', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const zLimit = world.config.tableWidth / 2 - cue.radius
    cue.position = { x: 0, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }
    cue.angularVelocity.y = 15

    world.step(STEP)

    expect(cue.velocity.z).toBeLessThan(0)
    expect(Math.abs(cue.velocity.x)).toBeGreaterThan(0.05)
    expect(Math.abs(cue.angularVelocity.y)).toBeLessThan(15)
  })

  it('stops a slow ball without reversing it', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    cue.velocity = { x: 0.001, z: 0 }

    world.step(STEP)

    expect(cue.velocity.x).toBe(0)
    expect(cue.velocity.z).toBe(0)
  })
})
