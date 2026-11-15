import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('physics input validation', () => {
  it.each([
    [{ x: Number.NaN, z: 0 }, 0.5, { side: 0, vertical: 0 }],
    [{ x: Number.POSITIVE_INFINITY, z: 0 }, 0.5, { side: 0, vertical: 0 }],
    [{ x: 1, z: 0 }, Number.NaN, { side: 0, vertical: 0 }],
    [{ x: 1, z: 0 }, 0.5, { side: Number.NaN, vertical: 0 }],
    [{ x: 1, z: 0 }, 0.5, { side: 0, vertical: Number.POSITIVE_INFINITY }],
    [{ x: 1, z: 0 }, 0.5, { side: 0, vertical: 0, elevation: Number.NaN }],
  ])('rejects non-finite shot inputs without changing the cue ball', (direction, power, spin) => {
    const world = new PhysicsWorld()
    const before = {
      position: { ...world.cueBall.position },
      velocity: { ...world.cueBall.velocity },
      angularVelocity: { ...world.cueBall.angularVelocity },
      verticalVelocity: world.cueBall.verticalVelocity,
    }

    expect(world.shootCueBall(direction, power, spin)).toBe(false)
    expect(world.cueBall).toMatchObject(before)
    expect(world.isMoving).toBe(false)
  })

  it.each([
    { x: Number.NaN, z: 0 },
    { x: 0, z: Number.POSITIVE_INFINITY },
    { x: Number.NEGATIVE_INFINITY, z: 0 },
  ])('rejects non-finite cue-ball placement coordinates %#', (position) => {
    const world = new PhysicsWorld()
    const before = { ...world.cueBall.position }

    expect(world.placeCueBall(position)).toBe(false)
    expect(world.cueBall.position).toEqual(before)
  })

  it('still accepts finite values and clamps supported shot controls', () => {
    const world = new PhysicsWorld()

    expect(world.shootCueBall({ x: 2, z: 0 }, 2, { side: 4, vertical: -4, elevation: 1 })).toBe(true)
    expect(Number.isFinite(world.cueBall.velocity.x)).toBe(true)
    expect(Number.isFinite(world.cueBall.velocity.z)).toBe(true)
    expect(Number.isFinite(world.cueBall.verticalVelocity)).toBe(true)
    expect(Number.isFinite(world.cueBall.angularVelocity.y)).toBe(true)
  })
})
