import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('live physics contact events', () => {
  it('emits a ball-contact event on the simulation step that resolves impact', () => {
    const world = new PhysicsWorld()
    world.cueBall.position = { x: 0.40, z: 0 }
    world.cueBall.previousPosition = { x: 0.40, z: 0 }
    world.cueBall.velocity = { x: 2.0, z: 0 }
    const target = world.balls.find((ball) => ball.number === 1)
    if (!target) throw new Error('Rack target ball missing')
    target.position = { x: 0.48, z: 0 }
    target.previousPosition = { ...target.position }
    let events: ReturnType<PhysicsWorld['consumeContactEvents']> = []
    for (let step = 0; step < 4 && events.length === 0; step += 1) {
      world.step(1 / 120)
      events = world.consumeContactEvents()
    }
    expect(events.some((event) => event.kind === 'ball' && event.ballNumber === 1)).toBe(true)
  })

  it('emits a rail-contact event when a ball rebounds from the cushion', () => {
    const world = new PhysicsWorld()
    const ball = world.cueBall
    const limit = world.config.tableLength / 2 - ball.radius - 0.001
    ball.position = { x: limit, z: 0 }
    ball.previousPosition = { ...ball.position }
    ball.velocity = { x: 2.0, z: 0 }
    world.step(1 / 120)
    const events = world.consumeContactEvents()
    expect(events.some((event) => event.kind === 'rail')).toBe(true)
  })

  it('consumes each step event only once', () => {
    const world = new PhysicsWorld()
    const ball = world.cueBall
    const limit = world.config.tableLength / 2 - ball.radius - 0.001
    ball.position = { x: limit, z: 0 }
    ball.previousPosition = { ...ball.position }
    ball.velocity = { x: 2.0, z: 0 }
    world.step(1 / 120)
    expect(world.consumeContactEvents().length).toBeGreaterThan(0)
    expect(world.consumeContactEvents()).toHaveLength(0)
  })
})
