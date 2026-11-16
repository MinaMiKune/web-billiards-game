import { describe, expect, it } from 'vitest'
import {
  POOL_TABLE_VISUAL_SPEC,
  getPoolTableSupportPositions,
} from '../src/rendering/PoolTableModel'

describe('reference-faithful pool table structure', () => {
  it('keeps six regulation pocket openings and a complete 9-foot support frame', () => {
    expect(POOL_TABLE_VISUAL_SPEC.pocketCount).toBe(6)
    expect(POOL_TABLE_VISUAL_SPEC.supportLegCount).toBe(6)
    expect(POOL_TABLE_VISUAL_SPEC.railHeight).toBeGreaterThan(0.09)
    expect(POOL_TABLE_VISUAL_SPEC.apronHeight).toBeGreaterThan(0.15)
    expect(POOL_TABLE_VISUAL_SPEC.floorY).toBe(-1.05)
  })

  it('places three paired supports symmetrically under the table apron', () => {
    const supports = getPoolTableSupportPositions()
    expect(supports).toHaveLength(6)
    expect(supports.filter((support) => support.z < 0)).toHaveLength(3)
    expect(supports.filter((support) => support.z > 0)).toHaveLength(3)
    expect(supports.map((support) => support.x)).toEqual([
      -1.016, -1.016, 0, 0, 1.016, 1.016,
    ])
    for (const support of supports) {
      expect(Math.abs(support.z)).toBeCloseTo(0.765, 3)
    }
  })

  it('uses restrained mahogany and tournament-green finish values', () => {
    expect(POOL_TABLE_VISUAL_SPEC.woodColor).toBe('#542719')
    expect(POOL_TABLE_VISUAL_SPEC.feltColor).toBe('#0d6842')
    expect(POOL_TABLE_VISUAL_SPEC.cushionColor).toBe('#174b35')
  })
})
