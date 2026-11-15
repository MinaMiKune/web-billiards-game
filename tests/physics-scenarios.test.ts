import { describe, expect, it } from 'vitest'
import { PhysicsWorld, type BallState, type Vec2 } from '../src/physics/PhysicsWorld'

const STEP = 1 / 120
const STEPS = 240

interface ShotScenario {
  name: string
  cuePosition: Vec2
  targetPosition?: Vec2
  direction: Vec2
  power: number
  spin?: { side: number; vertical: number }
}

const scenarios: ShotScenario[] = [
  {
    name: 'straight center-ball collision',
    cuePosition: { x: -0.16, z: 0 },
    targetPosition: { x: 0, z: 0 },
    direction: { x: 1, z: 0 },
    power: 0.65,
  },
  {
    name: 'cut shot with a small vertical offset',
    cuePosition: { x: -0.16, z: 0 },
    targetPosition: { x: 0, z: 0.035 },
    direction: { x: 1, z: 0 },
    power: 0.65,
  },
  {
    name: 'side-spin approach to the long cushion',
    cuePosition: { x: 1.02, z: 0.18 },
    direction: { x: 1, z: 0.08 },
    power: 0.55,
    spin: { side: 0.65, vertical: 0 },
  },
  {
    name: 'follow shot into an object ball',
    cuePosition: { x: -0.16, z: 0 },
    targetPosition: { x: 0, z: 0 },
    direction: { x: 1, z: 0 },
    power: 0.65,
    spin: { side: 0, vertical: 0.7 },
  },
]

function runScenario(scenario: ShotScenario) {
  const world = new PhysicsWorld()
  const cue = world.cueBall
  const target = world.balls.find((ball) => ball.number === 1) as BallState

  for (const ball of world.balls) {
    ball.active = false
    ball.pocketed = false
    ball.velocity = { x: 0, z: 0 }
    ball.angularVelocity = { x: 0, y: 0, z: 0 }
  }

  cue.active = true
  cue.position = { ...scenario.cuePosition }
  cue.previousPosition = { ...cue.position }
  target.active = Boolean(scenario.targetPosition)
  if (scenario.targetPosition) {
    target.position = { ...scenario.targetPosition }
    target.previousPosition = { ...target.position }
  }

  expect(world.shootCueBall(
    scenario.direction,
    scenario.power,
    scenario.spin,
  )).toBe(true)

  for (let frame = 0; frame < STEPS; frame += 1) world.step(STEP)

  return world.balls
    .filter((ball) => ball.active || ball.pocketed)
    .map((ball) => ({
      number: ball.number,
      position: { ...ball.position },
      velocity: { ...ball.velocity },
      angularVelocity: { ...ball.angularVelocity },
      active: ball.active,
      pocketed: ball.pocketed,
    }))
}

describe('standard shot scenario regressions', () => {
  it.each(scenarios)('replays $name deterministically', (scenario) => {
    expect(runScenario(scenario)).toEqual(runScenario(scenario))
  })

  it('transfers motion to the object ball in a straight center-ball shot', () => {
    const result = runScenario(scenarios[0])
    const objectBall = result.find((ball) => ball.number === 1)

    expect(objectBall).toBeDefined()
    expect(Math.abs(objectBall?.velocity.x ?? 0)).toBeGreaterThan(0)
    expect(Math.abs(objectBall?.position.x ?? 0)).toBeGreaterThan(0.01)
  })

  it('produces a bounded lateral response in a cut shot', () => {
    const result = runScenario(scenarios[1])
    const objectBall = result.find((ball) => ball.number === 1)

    expect(objectBall).toBeDefined()
    expect(Math.abs(objectBall?.velocity.z ?? 0)).toBeGreaterThan(0)
    expect(Math.abs(objectBall?.velocity.z ?? 0)).toBeLessThan(3)
  })

  it('keeps every simulated state finite across the scenario set', () => {
    for (const scenario of scenarios) {
      for (const ball of runScenario(scenario)) {
        expect(Number.isFinite(ball.position.x)).toBe(true)
        expect(Number.isFinite(ball.position.z)).toBe(true)
        expect(Number.isFinite(ball.velocity.x)).toBe(true)
        expect(Number.isFinite(ball.velocity.z)).toBe(true)
        expect(Number.isFinite(ball.angularVelocity.x)).toBe(true)
        expect(Number.isFinite(ball.angularVelocity.y)).toBe(true)
        expect(Number.isFinite(ball.angularVelocity.z)).toBe(true)
      }
    }
  })
})
