import { bench, describe } from 'vitest'
import { AIController, type AIDifficulty } from '../src/ai/AIController'
import { createInitialEightBallState } from '../src/game/EightBallRuleEngine'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('AI planning performance', () => {
  const world = new PhysicsWorld()
  const state = createInitialEightBallState()
  const ai = new AIController()

  for (const difficulty of [1, 2, 3, 4, 5] as AIDifficulty[]) {
    bench(`difficulty ${difficulty}`, () => {
      ai.planShot(world, state, difficulty)
    }, { time: 750, iterations: 3 })
  }
})

describe('Physics stepping performance', () => {
  bench('240 fixed steps (2 simulated seconds)', () => {
    const world = new PhysicsWorld()
    world.shootCueBall({ x: 1, z: 0 }, 0.72)
    for (let step = 0; step < 240; step += 1) world.step(1 / 120)
  }, { time: 750, iterations: 3 })
})
