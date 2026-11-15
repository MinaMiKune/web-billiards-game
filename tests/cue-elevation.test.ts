import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

describe('cue elevation input', () => {
  it('keeps a level cue shot planar by default', () => {
    const world = new PhysicsWorld()
    world.shootCueBall({ x: 1, z: 0 }, 0.7)
    expect(world.cueBall.verticalVelocity).toBe(0)
    expect(world.cueBall.velocity.x).toBeCloseTo(0.7 * world.config.maxShotSpeed, 8)
  })

  it('converts cue elevation into vertical and planar launch velocity', () => {
    const world = new PhysicsWorld()
    const elevation = 20 * Math.PI / 180
    world.shootCueBall({ x: 1, z: 0 }, 0.8, { side: 0, vertical: 0, elevation })
    const speed = 0.8 * world.config.maxShotSpeed
    expect(world.cueBall.verticalVelocity).toBeCloseTo(speed * Math.sin(elevation), 8)
    expect(world.cueBall.velocity.x).toBeCloseTo(speed * Math.cos(elevation), 8)
  })

  it('clamps excessive cue elevation to the supported physical range', () => {
    const world = new PhysicsWorld()
    world.shootCueBall({ x: 1, z: 0 }, 0.8, { side: 0, vertical: 0, elevation: 2 })
    const speed = 0.8 * world.config.maxShotSpeed
    expect(world.cueBall.verticalVelocity).toBeCloseTo(speed * Math.sin(0.45), 8)
  })
})
