import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

const STEP = 1 / 120

describe('Eight-ball rack layout', () => {
  it('places the 8-ball in the rack center', () => {
    const world = new PhysicsWorld()
    const eight = world.balls.find((ball) => ball.number === 8)
    const expectedX = 0.48 + 2 * world.config.ballRadius * 2.04 * Math.sqrt(3) / 2

    expect(eight).toBeDefined()
    expect(eight?.position.x).toBeCloseTo(expectedX, 8)
    expect(eight?.position.z).toBeCloseTo(0, 8)
  })

  it('places one solid and one stripe in the rear corners', () => {
    const world = new PhysicsWorld()
    const objectBalls = world.balls.filter((ball) => ball.number > 0)
    const rearX = Math.max(...objectBalls.map((ball) => ball.position.x))
    const rearRow = objectBalls.filter((ball) =>
      Math.abs(ball.position.x - rearX) < 1e-9,
    ).sort((a, b) => a.position.z - b.position.z)
    const rearCorners = [rearRow[0], rearRow[rearRow.length - 1]]

    expect(rearRow).toHaveLength(5)
    expect(rearCorners[0].number).toBeGreaterThanOrEqual(1)
    expect(rearCorners[0].number).toBeLessThanOrEqual(7)
    expect(rearCorners[1].number).toBeGreaterThanOrEqual(9)
    expect(rearCorners[1].number).toBeLessThanOrEqual(15)
  })

  it('contains each object-ball number exactly once', () => {
    const world = new PhysicsWorld()
    const numbers = world.balls.filter((ball) => ball.number > 0)
      .map((ball) => ball.number).sort((a, b) => a - b)
    expect(numbers).toEqual(Array.from({ length: 15 }, (_, index) => index + 1))
  })
})

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
    cue.position = { x: 0, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    expect(cue.pocketed).toBe(true)
    expect(cue.active).toBe(false)
  })

  it('records distinct object balls that reach a rail after first contact', () => {
    const world = new PhysicsWorld()
    const [cue, target] = world.balls
    for (const ball of world.balls) ball.active = false

    const xLimit = world.config.tableLength / 2 - target.radius
    target.active = true
    target.position = { x: xLimit - 0.005, z: 0 }
    target.previousPosition = { ...target.position }
    target.velocity = { x: 0, z: 0 }

    cue.active = true
    cue.position = {
      x: target.position.x - cue.radius - target.radius - 0.001,
      z: 0,
    }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 2, z: 0 }

    world.step(STEP)
    world.step(STEP)

    expect(world.getShotTelemetry().firstContactBallNumber).toBe(1)
    expect(world.getShotTelemetry().railContactBallNumbersAfterFirstHit).toContain(1)
  })

  it('restricts cue-ball placement to the head area when requested', () => {
    const world = new PhysicsWorld()
    expect(world.placeCueBall({ x: 0, z: 0 }, 'behind-head-string')).toBe(false)
    expect(world.placeCueBall({ x: -world.config.tableLength * 0.4, z: 0 }, 'behind-head-string')).toBe(true)
  })

  it('records the correct pocket index for a side-pocket capture', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const zLimit = world.config.tableWidth / 2 - cue.radius
    cue.position = { x: 0, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    expect(world.getShotTelemetry().pocketedBallEvents).toContainEqual({
      ballNumber: 0,
      pocketIndex: 4,
    })
  })

  it('animates a pocketed ball into the pocket before hiding it', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const zLimit = world.config.tableWidth / 2 - cue.radius
    cue.position = { x: 0, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    let renderCue = world.getRenderBalls(1).find((ball) => ball.id === 'cue')
    expect(cue.pocketed).toBe(true)
    expect(renderCue?.active).toBe(false)
    expect(renderCue?.pocketed).toBe(true)
    expect(renderCue?.pocketProgress).toBe(0)

    world.step(world.config.pocketDropDuration / 2)
    renderCue = world.getRenderBalls(1).find((ball) => ball.id === 'cue')
    expect(renderCue?.pocketProgress).toBeCloseTo(0.5, 6)

    world.step(world.config.pocketDropDuration)
    renderCue = world.getRenderBalls(1).find((ball) => ball.id === 'cue')
    expect(renderCue?.pocketProgress).toBe(1)
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


  it('captures a ball through each of the four corner entry paths', () => {
    for (const xSign of [-1, 1]) {
      for (const zSign of [-1, 1]) {
        const world = new PhysicsWorld()
        const cue = world.cueBall
        const xLimit = world.config.tableLength / 2 - cue.radius
        const zLimit = world.config.tableWidth / 2 - cue.radius
        cue.position = { x: xSign * (xLimit - 0.001), z: zSign * (zLimit - 0.001) }
        cue.previousPosition = { ...cue.position }
        cue.velocity = { x: xSign, z: zSign }
        world.step(STEP)
        expect(cue.pocketed, `ball should drop at corner ${xSign}, ${zSign}`).toBe(true)
      }
    }
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
    cue.position = { x: 0.2, z: zLimit - 0.001 }
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


describe('PhysicsWorld clone', () => {
  it('creates an independent simulation copy', () => {
    const world = new PhysicsWorld()
    world.cueBall.velocity = { x: 1, z: 0 }

    const copy = world.clone()
    copy.step(STEP)

    expect(copy.cueBall.position.x).toBeGreaterThan(world.cueBall.position.x)
    expect(world.cueBall.position.x).toBeCloseTo(-0.72, 8)
    expect(copy.cueBall.velocity.x).toBeLessThan(world.cueBall.velocity.x)
  })
})

describe('Shot telemetry and ball placement', () => {
  it('records the first cue-ball contact and pocket events', () => {
    const world = new PhysicsWorld()
    world.shootCueBall({ x: 1, z: 0 }, 1)
    const [cue, target] = world.balls
    cue.position = { x: -0.04, z: 0 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1, z: 0 }
    target.position = { x: 0.02, z: 0 }
    target.previousPosition = { ...target.position }
    target.velocity = { x: 0, z: 0 }

    world.step(STEP)

    expect(world.getShotTelemetry().firstContactBallNumber).toBe(1)
  })

  it('places the cue ball only at a clear legal table position', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    cue.active = false
    cue.pocketed = true

    expect(world.placeCueBall({ x: 0.4, z: 0.3 })).toBe(true)
    expect(cue.active).toBe(true)
    expect(cue.pocketed).toBe(false)
    expect(world.placeCueBall({ x: 0.5, z: 0 })).toBe(false)
    expect(world.placeCueBall({ x: 1.26, z: 0.6 })).toBe(false)
  })
})
