import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('contact solver dynamics', () => {
  it('subdivides a large frame delta so a fast cue ball cannot tunnel through a target', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const target = world.balls.find((ball) => ball.number === 1)
    if (!target) throw new Error('Target ball missing')
    cue.position = { x: 0.2, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 2.8, z: 0 }
    target.position = { x: 0.28, z: 0 }
    target.previousPosition = { ...target.position }
    target.velocity = { x: 0, z: 0 }

    world.step(1 / 30)

    expect(target.velocity.x).toBeGreaterThan(0.1)
    expect(cue.velocity.x).toBeLessThan(2.8)
  })

  it('transfers side-spin angular momentum through a frictional ball contact', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const target = world.balls.find((ball) => ball.number === 1)
    if (!target) throw new Error('Target ball missing')
    cue.position = { x: 0.2, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1.4, z: 0 }
    cue.angularVelocity.y = 24
    target.position = { x: 0.255, z: 0 }
    target.previousPosition = { ...target.position }
    target.velocity = { x: 0, z: 0 }

    world.step(1 / 120)

    expect(Math.abs(target.angularVelocity.y)).toBeGreaterThan(0)
    expect(Math.abs(target.velocity.z)).toBeGreaterThan(0)
  })

  it('emits one ball-contact event per pair during a solver step', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const target = world.balls.find((ball) => ball.number === 1)
    if (!target) throw new Error('Target ball missing')
    cue.position = { x: 0.2, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1.2, z: 0 }
    target.position = { x: 0.255, z: 0 }
    target.previousPosition = { ...target.position }
    target.velocity = { x: 0, z: 0 }

    world.step(1 / 120)
    const events = world.consumeContactEvents().filter((event) => event.kind === 'ball')

    expect(events).toHaveLength(1)
  })
})
