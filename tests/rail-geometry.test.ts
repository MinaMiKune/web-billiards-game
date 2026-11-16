import { describe, expect, it } from 'vitest'
import { DEFAULT_PHYSICS_CONFIG } from '../src/physics/PhysicsWorld'
import { getLongRailSegments } from '../src/rendering/RailGeometry'

describe('long rail pocket clearance', () => {
  const halfLength = DEFAULT_PHYSICS_CONFIG.tableLength / 2
  const railDepth = 0.14
  const pocketRadius = DEFAULT_PHYSICS_CONFIG.pocketCaptureRadius + 0.012
  const sideJawOuterX = DEFAULT_PHYSICS_CONFIG.sidePocketHalfWidth +
    DEFAULT_PHYSICS_CONFIG.ballRadius + DEFAULT_PHYSICS_CONFIG.pocketJawDepth
  const cornerClearance = pocketRadius + railDepth / 2 + 0.008
  const segments = getLongRailSegments(halfLength, sideJawOuterX, cornerClearance)

  it('creates two independent spans per long rail, leaving all three mouths open', () => {
    expect(segments).toHaveLength(2)
    expect(segments[0].start).toBeGreaterThan(-halfLength + pocketRadius + railDepth / 2)
    expect(segments[0].end).toBe(-sideJawOuterX)
    expect(segments[1].start).toBe(sideJawOuterX)
    expect(segments[1].end).toBeLessThan(halfLength - pocketRadius - railDepth / 2)
  })

  it('keeps a real gap at the side pocket and both corner pockets', () => {
    expect(segments[0].end).toBeLessThan(segments[1].start)
    for (const segment of segments) {
      expect(segment.length).toBeGreaterThan(0)
      expect(segment.center - segment.length / 2).toBe(segment.start)
      expect(segment.center + segment.length / 2).toBe(segment.end)
    }
  })
})
