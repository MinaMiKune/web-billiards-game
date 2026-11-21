import { describe, expect, it } from 'vitest'
import { PhysicsWorld } from '../src/physics/PhysicsWorld'
import {
  CORNER_JAW_START_OFFSET,
  CORNER_POCKET_JAW_TIP_OFFSET,
  CORNER_POCKET_MOUTH_RADIUS,
  SIDE_JAW_START_OFFSET,
  SIDE_POCKET_JAW_TIP_OFFSET,
} from '../src/physics/tableSpec'

const STEP = 1 / 120

describe('Pocket jaw collisions', () => {
  it('deflects a side-pocket near-miss off the angled jaw', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const halfWidth = world.config.tableWidth / 2
    // Jaw faces are shared with the renderer via the unified table spec:
    // they start one jaw depth beyond the visible mouth on the rail line and
    // taper to the pocket tip.
    const start = { x: SIDE_JAW_START_OFFSET, z: halfWidth }
    const end = {
      x: SIDE_POCKET_JAW_TIP_OFFSET,
      z: halfWidth - SIDE_POCKET_JAW_TIP_OFFSET,
    }
    const midpoint = {
      x: (start.x + end.x) / 2,
      z: (start.z + end.z) / 2,
    }
    const segmentLength = Math.hypot(end.x - start.x, end.z - start.z)
    // Playable side of the +x side-pocket jaw faces the table interior.
    const inwardNormal = {
      x: (start.z - end.z) / segmentLength,
      z: (end.x - start.x) / segmentLength,
    }

    cue.position = {
      x: midpoint.x + inwardNormal.x * cue.radius * 0.45,
      z: midpoint.z + inwardNormal.z * cue.radius * 0.45,
    }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    expect(cue.pocketed).toBe(false)
    expect(cue.velocity.x).toBeGreaterThan(0.2)
    expect(cue.position.z).toBeLessThan(halfWidth - cue.radius)
  })

  it('deflects a corner-pocket near-miss off the angled jaw', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const halfLength = world.config.tableLength / 2
    const halfWidth = world.config.tableWidth / 2
    const start = { x: halfLength - CORNER_JAW_START_OFFSET, z: halfWidth }
    const end = {
      x: halfLength - CORNER_POCKET_JAW_TIP_OFFSET,
      z: halfWidth - CORNER_POCKET_JAW_TIP_OFFSET,
    }
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

    expect(cue.pocketed).toBe(false)
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

  it('captures a ball that enters within the visible side-pocket mouth', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const zLimit = world.config.tableWidth / 2 - cue.radius
    // Just inside the visible 5 in mouth: the ball must drop, not bounce.
    const entryX = world.config.sidePocketHalfWidth - cue.radius * 0.9
    cue.position = { x: entryX, z: zLimit - 0.001 }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 0, z: 1 }

    world.step(STEP)

    expect(cue.pocketed).toBe(true)
    expect(cue.active).toBe(false)
  })

  it('bounces a ball that strikes rubber just outside the visible corner mouth', () => {
    const world = new PhysicsWorld()
    const cue = world.cueBall
    const halfLength = world.config.tableLength / 2
    const halfWidth = world.config.tableWidth / 2
    // Approach the corner mouth along the end-rail jaw: just outside the
    // visible 4.5 in circle the jaw face must bounce the ball back, proving
    // nothing vanishes over solid rubber.
    const entryOffset = CORNER_POCKET_MOUTH_RADIUS + cue.radius * 0.8
    cue.position = {
      x: halfLength - 0.002,
      z: halfWidth - entryOffset,
    }
    cue.previousPosition = { ...cue.position }
    cue.velocity = { x: 1, z: 0 }

    world.step(STEP)

    expect(cue.pocketed).toBe(false)
    expect(cue.active).toBe(true)
    expect(cue.velocity.x).toBeLessThan(0)
  })
})
