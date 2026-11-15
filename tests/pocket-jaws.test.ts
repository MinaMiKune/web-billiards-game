import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'

const STEP = 1 / 120

describe('Pocket jaw collisions', () => {
  it('deflects a side-pocket near-miss off the angled jaw', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const halfWidth = world.config.tableWidth / 2
    const jawDepth = world.config.pocketJawDepth
    const jawInnerX = world.config.sidePocketHalfWidth + cue.radius
    const start = { x: jawInnerX, z: halfWidth - jawDepth }
    const end = { x: jawInnerX + jawDepth, z: halfWidth }
    const midpoint = {
      x: (start.x + end.x) / 2,
      z: (start.z + end.z) / 2,
    }
    const inwardNormal = { x: Math.SQRT1_2, z: -Math.SQRT1_2 }

    cue.position = {
      x: midpoint.x + inwardNormal.x * cue.radius * 0.45,
      z: midpoint.z + inwardNormal.z * cue.radius * 0.45,
    }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    expect(cue.velocity.x).toBeGreaterThan(0.2)
    expect(cue.position.z).toBeLessThan(halfWidth - cue.radius)
  })

  it('deflects a corner-pocket near-miss off the angled jaw', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const halfLength = world.config.tableLength / 2
    const halfWidth = world.config.tableWidth / 2
    const mouthRadius = world.config.pocketCaptureRadius
    const jawDepth = world.config.pocketJawDepth
    const innerOffset = Math.max(0, mouthRadius - jawDepth)
    const start = { x: halfLength - mouthRadius, z: halfWidth }
    const end = { x: halfLength - innerOffset, z: halfWidth - innerOffset }
    const segmentLength = Math.hypot(end.x - start.x, end.z - start.z)
    const inwardNormal = {
      x: (end.z - start.z) / segmentLength,
      z: -(end.x - start.x) / segmentLength,
    }

    cue.position = {
      x: start.x + inwardNormal.x * cue.radius * 0.45,
      z: start.z + inwardNormal.z * cue.radius * 0.45,
    }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0.7, z: 0.7 }

    world.step(STEP)

    expect(cue.velocity.x).toBeLessThan(0)
    expect(cue.velocity.z).toBeLessThan(0)
  })

  it('still captures a clean shot through the center of a side pocket', () => {
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
})
