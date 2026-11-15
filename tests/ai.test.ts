import { describe, expect, it } from 'vitest'
import { AIController, type AIDifficulty } from '../src/ai/AIController'
import { createInitialEightBallState } from '../src/game/EightBallRuleEngine'
import { DEFAULT_PHYSICS_CONFIG, PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('AIController', () => {
  it('plans a valid shot using a cloned copy of the real physics world', () => {
    const world = new PhysicsWorld()
    for (const ball of world.balls) ball.active = false

    const cue = world.cueBall
    cue.active = true
    cue.position = { x: -0.65, z: -0.35 }
    cue.previousPosition = { ...cue.position }
    cue.pocketed = false

    const target = world.balls.find((ball) => ball.number === 1)
    if (!target) throw new Error('Test target ball is missing')
    target.active = true
    target.position = { x: 0.5, z: 0 }
    target.previousPosition = { ...target.position }

    const state = {
      ...createInitialEightBallState(),
      phase: 'open-table' as const,
      remainingBalls: [1],
    }
    const plan = new AIController().planShot(world, state, 3)

    expect(plan).not.toBeNull()
    expect(plan?.targetBallNumber).toBe(1)
    expect(plan?.command.power).toBeGreaterThan(0)
    expect(plan?.command.power).toBeLessThanOrEqual(1)
    expect(Math.hypot(
      plan?.command.direction.x ?? 0,
      plan?.command.direction.z ?? 0,
    )).toBeCloseTo(1, 6)
    expect(world.cueBall.position.x).toBeCloseTo(-0.65, 8)
    expect(world.cueBall.velocity.x).toBe(0)
  })

  it('selects a legal open-table cue-ball position', () => {
    const world = new PhysicsWorld()
    world.cueBall.active = false
    world.cueBall.pocketed = true

    const state = createInitialEightBallState()
    state.phase = 'open-table'
    const placement = new AIController().chooseBallInHandPlacement(world, state)

    expect(placement).not.toBeNull()
    const copy = world.clone()
    expect(copy.placeCueBall(placement!)).toBe(true)
  })

  it('scales legal ball-in-hand search to non-default table dimensions', () => {
    const world = new PhysicsWorld({
      ...DEFAULT_PHYSICS_CONFIG,
      tableLength: 3.2,
      tableWidth: 1.6,
    })
    world.cueBall.active = false
    world.cueBall.pocketed = true

    const state = createInitialEightBallState()
    state.phase = 'open-table'
    const placement = new AIController().chooseBallInHandPlacement(world, state)

    expect(placement).not.toBeNull()
    expect(Math.abs(placement!.x)).toBeLessThan(3.2 / 2 - world.cueBall.radius)
    expect(Math.abs(placement!.z)).toBeLessThan(1.6 / 2 - world.cueBall.radius)
    const copy = world.clone()
    expect(copy.placeCueBall(placement!)).toBe(true)
  })

  it('supports all five difficulty profiles', () => {
    const ai = new AIController()
    const world = new PhysicsWorld()
    const state = createInitialEightBallState()

    for (const level of [1, 2, 3, 4, 5] as AIDifficulty[]) {
      const plan = ai.planShot(world, state, level)
      expect(plan?.difficulty).toBe(level)
    }
  })
})
