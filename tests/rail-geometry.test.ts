import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { DEFAULT_PHYSICS_CONFIG } from '../src/physics/PhysicsWorld'
import {
  CORNER_RAIL_CLEARANCE,
  POOL_TABLE_VISUAL_SPEC,
  SIDE_RAIL_GAP_HALF,
  getPoolTableLongRailSegments,
  getPoolTableSupportPositions,
} from '../src/rendering/PoolTableModel'

describe('reference-faithful table rail and pocket geometry', () => {
  it('keeps all six pocket mouths clear of the wooden rail runs', () => {
    const segments = getPoolTableLongRailSegments()
    const halfLength = DEFAULT_PHYSICS_CONFIG.tableLength / 2

    expect(segments).toHaveLength(2)
    expect(segments[0].start).toBeGreaterThanOrEqual(-halfLength + CORNER_RAIL_CLEARANCE)
    expect(segments[0].end).toBe(-SIDE_RAIL_GAP_HALF)
    expect(segments[1].start).toBe(SIDE_RAIL_GAP_HALF)
    expect(segments[1].end).toBeLessThanOrEqual(halfLength - CORNER_RAIL_CLEARANCE)
    expect(segments[0].end).toBeLessThan(segments[1].start)
  })

  it('matches the rendered side-jaw clearance to the physics collision jaw', () => {
    const expected = DEFAULT_PHYSICS_CONFIG.sidePocketHalfWidth +
      DEFAULT_PHYSICS_CONFIG.ballRadius +
      DEFAULT_PHYSICS_CONFIG.pocketJawDepth

    expect(SIDE_RAIL_GAP_HALF).toBeCloseTo(expected, 12)
  })

  it('keeps the table as one connected model with no old per-renderer pocket patches', () => {
    const rendererSource = readFileSync(
      new URL('../src/rendering/GameRenderer.ts', import.meta.url),
      'utf8',
    )
    expect(rendererSource).toContain("from './PoolTableModel'")
    expect(rendererSource).toContain('createPoolTableModel(this.renderer')
    expect(rendererSource).toContain('this.scene.add(table)')
    expect(rendererSource).not.toContain('private addCornerPocketCaps')
    expect(rendererSource).not.toContain('private addAngledCushionNose')
    expect(rendererSource).toContain('this.renderer.shadowMap.autoUpdate = false')
    expect(rendererSource).toContain('this.renderer.shadowMap.needsUpdate = true')
  })

  it('uses a six-leg chassis and understated tournament-table finishes', () => {
    expect(POOL_TABLE_VISUAL_SPEC.pocketCount).toBe(6)
    expect(POOL_TABLE_VISUAL_SPEC.supportLegCount).toBe(6)
    expect(POOL_TABLE_VISUAL_SPEC.woodColor).toBe('#75432f')
    expect(POOL_TABLE_VISUAL_SPEC.feltColor).toBe('#0d6842')
    expect(POOL_TABLE_VISUAL_SPEC.cushionColor).toBe('#113c2a')

    const supports = getPoolTableSupportPositions()
    expect(supports).toHaveLength(6)
    expect(supports.filter((support) => support.x === 0)).toHaveLength(2)
  })
})
