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

  it('decelerates a moving ball', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    cue.velocity = { x: 1, z: 0 }

    world.step(STEP)

    expect(cue.velocity.x).toBeLessThan(1)
    expect(cue.velocity.x).toBeGreaterThan(0)
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
    cue.position = { x: 0, z: zLimit - 0.001 }
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

  it('stops a slow ball without reversing it', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    cue.velocity = { x: 0.001, z: 0 }

    world.step(STEP)

    expect(cue.velocity.x).toBe(0)
    expect(cue.velocity.z).toBe(0)
  })
})
