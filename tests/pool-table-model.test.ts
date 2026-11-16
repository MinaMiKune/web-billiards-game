import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CORNER_POCKET_MOUTH_RADIUS, SIDE_POCKET_MOUTH_RADIUS } from '../src/rendering/TableGeometry'
import { DEFAULT_PHYSICS_CONFIG } from '../src/physics/PhysicsWorld'
import {
  POOL_TABLE_VISUAL_SPEC,
  getPoolTableSupportPositions,
  SIDE_POCKET_JAW_INNER_X,
  CORNER_POCKET_JAW_INNER_OFFSET,
  getPoolTableCrossBraceDepth,
} from '../src/rendering/PoolTableModel'

describe('reference-faithful pool table structure', () => {
  it('keeps six regulation pocket openings and a complete 9-foot support frame', () => {
    expect(POOL_TABLE_VISUAL_SPEC.pocketCount).toBe(6)
    expect(POOL_TABLE_VISUAL_SPEC.supportLegCount).toBe(6)
    expect(POOL_TABLE_VISUAL_SPEC.railHeight).toBe(0.075)
    expect(POOL_TABLE_VISUAL_SPEC.apronHeight).toBeGreaterThan(0.15)
    expect(POOL_TABLE_VISUAL_SPEC.floorY).toBe(-0.78)
  })

  it('places three paired supports symmetrically under the table apron', () => {
    const supports = getPoolTableSupportPositions()
    expect(supports).toHaveLength(6)
    expect(supports.filter((support) => support.z < 0)).toHaveLength(3)
    expect(supports.filter((support) => support.z > 0)).toHaveLength(3)
    expect(supports.map((support) => support.x)).toEqual([
      -1.016, -1.016, 0, 0, 1.016, 1.016,
    ])
    const centreSupports = supports.filter((support) => support.x === 0)
    const endSupports = supports.filter((support) => support.x !== 0)
    expect(centreSupports.map((support) => Math.abs(support.z))).toEqual([
      DEFAULT_PHYSICS_CONFIG.tableWidth * POOL_TABLE_VISUAL_SPEC.centreSupportZFraction,
      DEFAULT_PHYSICS_CONFIG.tableWidth * POOL_TABLE_VISUAL_SPEC.centreSupportZFraction,
    ])
    for (const support of endSupports) {
      expect(Math.abs(support.z)).toBeCloseTo(
        DEFAULT_PHYSICS_CONFIG.tableWidth / 2 + POOL_TABLE_VISUAL_SPEC.apronOutset,
        3,
      )
    }

    const pocketOuterEdge = DEFAULT_PHYSICS_CONFIG.tableWidth / 2 + SIDE_POCKET_MOUTH_RADIUS
    const apronInnerEdge = DEFAULT_PHYSICS_CONFIG.tableWidth / 2 +
      POOL_TABLE_VISUAL_SPEC.apronOutset - POOL_TABLE_VISUAL_SPEC.apronDepth / 2
    expect(apronInnerEdge).toBeGreaterThan(pocketOuterEdge)

    const cornerPocketOuterEdge = DEFAULT_PHYSICS_CONFIG.tableLength / 2 +
      CORNER_POCKET_MOUTH_RADIUS
    const endApronInnerEdge = DEFAULT_PHYSICS_CONFIG.tableLength / 2 +
      POOL_TABLE_VISUAL_SPEC.apronOutset - POOL_TABLE_VISUAL_SPEC.apronDepth / 2
    expect(endApronInnerEdge).toBeGreaterThan(cornerPocketOuterEdge)

    const centreSupportOuterEdge = Math.abs(centreSupports[0].z) +
      POOL_TABLE_VISUAL_SPEC.supportBlockDepth / 2
    const sidePocketInnerEdge = DEFAULT_PHYSICS_CONFIG.tableWidth / 2 -
      SIDE_POCKET_MOUTH_RADIUS
    expect(centreSupportOuterEdge).toBeLessThan(sidePocketInnerEdge)

    const centreCrossBraceHalfSpan = getPoolTableCrossBraceDepth(0) / 2
    expect(centreCrossBraceHalfSpan).toBeLessThan(sidePocketInnerEdge)
    expect(
      sidePocketInnerEdge - centreCrossBraceHalfSpan,
    ).toBeCloseTo(POOL_TABLE_VISUAL_SPEC.crossBracePocketClearance, 12)
    expect(getPoolTableCrossBraceDepth(DEFAULT_PHYSICS_CONFIG.tableLength * 0.4))
      .toBeGreaterThan(DEFAULT_PHYSICS_CONFIG.tableWidth)
  })

  it('uses restrained mahogany and tournament-green finish values', () => {
    expect(POOL_TABLE_VISUAL_SPEC.woodColor).toBe('#75432f')
    expect(POOL_TABLE_VISUAL_SPEC.feltColor).toBe('#0d6842')
    expect(POOL_TABLE_VISUAL_SPEC.cushionColor).toBe('#113c2a')
    expect(POOL_TABLE_VISUAL_SPEC.pocketJawColor).toBe('#236b45')
  })  
  it('keeps pocket interiors dark and free of top-down radial spokes', () => {
    const modelSource = readFileSync(
      new URL('../src/rendering/PoolTableModel.ts', import.meta.url),
      'utf8',
    )
    expect(modelSource).not.toContain('CatmullRomCurve3')
    expect(modelSource).not.toContain('TubeGeometry')
    expect(modelSource).not.toContain('new CircleGeometry')
    expect(modelSource).not.toContain('pocketBottom')
    expect(modelSource).toContain('createPocketThroatGeometry(mouthRadius)')
    expect(modelSource).toContain('open-ended sleeve')
    expect(SIDE_POCKET_JAW_INNER_X).toBeCloseTo(SIDE_POCKET_MOUTH_RADIUS / Math.SQRT2, 12)
    expect(CORNER_POCKET_JAW_INNER_OFFSET).toBeCloseTo(CORNER_POCKET_MOUTH_RADIUS / Math.SQRT2, 12)
    expect(Math.hypot(SIDE_POCKET_JAW_INNER_X, SIDE_POCKET_JAW_INNER_X))
      .toBeCloseTo(SIDE_POCKET_MOUTH_RADIUS, 12)
    expect(Math.hypot(CORNER_POCKET_JAW_INNER_OFFSET, CORNER_POCKET_JAW_INNER_OFFSET))
      .toBeCloseTo(CORNER_POCKET_MOUTH_RADIUS, 12)
  })

})
