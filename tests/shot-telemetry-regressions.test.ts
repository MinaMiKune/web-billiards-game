import { describe, expect, it } from 'vitest'
import { DEFAULT_PHYSICS_CONFIG, PhysicsWorld } from '../src/physics/PhysicsWorld'

const STEP = 1 / 120

describe('shot telemetry regressions', () => {
  it('records the first object-ball contact and a later cushion contact', () => {
    const world = new PhysicsWorld({
      ...DEFAULT_PHYSICS_CONFIG,
      slidingFriction: 0,
      rollingDeceleration: 0,
      sideSpinDecay: 0,
      ballCollisionFriction: 0,
      ballRestitution: 1,
      cushionRestitution: 1,
    })
    const [cue, target] = world.balls
    for (const ball of world.balls) ball.active = false

    cue.active = true
    target.active = true
    cue.position = { x: 1.08, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 2.8, z: 0 }
    target.position = { x: 1.15, z: 0 }
    target.previousPosition = { ...target.position }
    target.velocity = { x: 0, z: 0 }

    expect(world.shootCueBall({ x: 1, z: 0 }, 1)).toBe(true)
    cue.velocity = { x: 2.8, z: 0 }

    for (let frame = 0; frame < 12; frame += 1) world.step(STEP)

    const telemetry = world.getShotTelemetry()
    expect(telemetry.firstContactBallNumber).toBe(1)
    expect(telemetry.railContactAfterFirstHit).toBe(true)
  })

  it('records a cue-ball scratch in both dedicated and pocket event fields', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    for (const ball of world.balls) {
      if (ball.number !== 0) ball.active = false
    }

    expect(world.shootCueBall({ x: 0, z: 1 }, 0.5)).toBe(true)
    const zLimit = world.config.tableWidth / 2 - cue.radius
    cue.position = { x: 0, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    const telemetry = world.getShotTelemetry()
    expect(telemetry.cueBallPocketed).toBe(true)
    expect(telemetry.pocketedBallNumbers).toContain(0)
  })

  it('returns a defensive copy of pocketed-ball telemetry', () => {
    const world = new PhysicsWorld()
    world.shootCueBall({ x: 1, z: 0 }, 0.5)
    const telemetry = world.getShotTelemetry()

    telemetry.pocketedBallNumbers.push(99)

    expect(world.getShotTelemetry().pocketedBallNumbers).not.toContain(99)
  })
})
