import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('vertical ball dynamics', () => {
  it('launches the cue ball along an elevated trajectory when cue elevation is supplied', () => {
    const world = new PhysicsWorld()
    expect(world.shootCueBall({ x: 1, z: 0 }, 0.8, { side: 0, vertical: 0, elevation: 0.3 })).toBe(true)
    world.step(1 / 120)
    expect(world.cueBall.height).toBeGreaterThan(0)
    expect(world.cueBall.verticalVelocity).toBeGreaterThan(0)
    expect(world.getRenderBalls(1).find((ball) => ball.number === 0)?.height).toBeGreaterThan(0)
  })

  it('does not apply cloth friction while the ball is airborne', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    cue.height = 0.1
    cue.previousHeight = 0.1
    cue.velocity = { x: 1, z: 0 }
    cue.angularVelocity = { x: 0, y: 0, z: 0 }
    world.step(1 / 120)
    expect(cue.velocity.x).toBeCloseTo(1, 8)
    expect(cue.height).toBeGreaterThan(0)
  })

  it('resolves ball contacts in three dimensions and transfers vertical velocity', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const target = world.balls.find((ball) => ball.number === 1)
    if (!target) throw new Error('Target ball missing')
    cue.position = { x: 0.2, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1.2, z: 0 }
    target.position = { x: 0.25, z: 0 }
    target.previousPosition = { ...target.position }
    target.height = 0.02
    target.previousHeight = 0.02
    target.velocity = { x: 0, z: 0 }
    world.step(1 / 120)
    expect(target.velocity.x).toBeGreaterThan(0)
    expect(Math.abs(target.verticalVelocity)).toBeGreaterThan(0)
  })

  it('allows an elevated ball to clear the cushion nose', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const limit = world.config.tableLength / 2 - cue.radius - 0.001
    cue.position = { x: limit, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.height = 0.06
    cue.previousHeight = 0.06
    cue.velocity = { x: 1, z: 0 }
    world.step(1 / 120)
    expect(cue.velocity.x).toBeGreaterThan(0.9)
    expect(cue.position.x).toBeGreaterThan(limit)
  })
})
