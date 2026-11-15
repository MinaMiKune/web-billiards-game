import { describe, expect, it } from 'vitest'
import { AIController, type AIDifficulty } from '../src/ai/AIController'
import { createInitialEightBallState } from '../src/game/EightBallRuleEngine'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('Performance benchmark smoke', () => {
  it('reports AI planning timings for all five difficulty levels', () => {
    const world = new PhysicsWorld()
    const state = createInitialEightBallState()
    const ai = new AIController()
    const results: { difficulty: AIDifficulty; averageMilliseconds: number }[] = []

    for (const difficulty of [1, 2, 3, 4, 5] as AIDifficulty[]) {
      const startedAt = performance.now()
      const iterations = 3
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        ai.planShot(world, state, difficulty)
      }
      const averageMilliseconds = (performance.now() - startedAt) / iterations
      results.push({ difficulty, averageMilliseconds })
    }

    console.info('[performance] AI planning average ms:', JSON.stringify(results))
    expect(results).toHaveLength(5)
    expect(results.every((result) => Number.isFinite(result.averageMilliseconds) &&
      result.averageMilliseconds >= 0)).toBe(true)
  }, 30000)

  it('reports a 240-step physics scenario timing', () => {
    const iterations = 3
    const startedAt = performance.now()
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      const world = new PhysicsWorld()
      world.shootCueBall({ x: 1, z: 0 }, 0.72)
      for (let step = 0; step < 240; step += 1) world.step(1 / 120)
    }
    const averageMilliseconds = (performance.now() - startedAt) / iterations
    console.info('[performance] 240 physics steps average ms:', averageMilliseconds.toFixed(3))
    expect(Number.isFinite(averageMilliseconds)).toBe(true)
    expect(averageMilliseconds).toBeGreaterThanOrEqual(0)
  })
})
