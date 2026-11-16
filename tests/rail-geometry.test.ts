import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { DEFAULT_PHYSICS_CONFIG } from '../src/physics/PhysicsWorld'
import { getLongRailSegments } from '../src/rendering/RailGeometry'

describe('long rail pocket clearance', () => {
  const halfLength = DEFAULT_PHYSICS_CONFIG.tableLength / 2
  const railDepth = 0.14
  const pocketRadius = DEFAULT_PHYSICS_CONFIG.pocketCaptureRadius + 0.012
  const sideJawOuterX = DEFAULT_PHYSICS_CONFIG.sidePocketHalfWidth +
    DEFAULT_PHYSICS_CONFIG.ballRadius + DEFAULT_PHYSICS_CONFIG.pocketJawDepth
  const cornerClearance = 0.10
  const segments = getLongRailSegments(halfLength, sideJawOuterX, cornerClearance)

  it('creates two independent spans per long rail, leaving all three mouths open', () => {
    expect(segments).toHaveLength(2)
    expect(segments[0].start + 1e-9).toBeGreaterThanOrEqual(-halfLength + cornerClearance)
    expect(segments[0].end).toBe(-sideJawOuterX)
    expect(segments[1].start).toBe(sideJawOuterX)
    expect(segments[1].end - 1e-9).toBeLessThanOrEqual(halfLength - cornerClearance)
  })

  it('keeps a real gap at the side pocket and both corner pockets', () => {
    expect(segments[0].end).toBeLessThan(segments[1].start)
    for (const segment of segments) {
      expect(segment.length).toBeGreaterThan(0)
      expect(segment.center - segment.length / 2).toBeCloseTo(segment.start, 12)
      expect(segment.center + segment.length / 2).toBeCloseTo(segment.end, 12)
    }
  })
})


describe('pocket jaw materials', () => {
  it('does not generate separate wooden slats at the pocket mouths', () => {
    const rendererSource = readFileSync(
      new URL('../src/rendering/GameRenderer.ts', import.meta.url),
      'utf8',
    )
    expect(rendererSource).not.toContain('addSidePocketJaws')
    expect(rendererSource).not.toContain('addAngledJaw(railWood')
    expect(rendererSource).toContain('addSidePocketCushions(cushion')
    expect(rendererSource).toContain('addAngledCushionNose(cushion')
    expect(rendererSource).toContain('A cushion jaw is a tapered wedge, not a rectangular green slat.')
    expect(rendererSource).toContain('wedge.lineTo(end.x + perpendicularX, end.z + perpendicularZ)')
    expect(rendererSource).toContain('new ExtrudeGeometry(wedge, { depth: height, bevelEnabled: false, curveSegments: 8 })')
    expect(rendererSource).not.toContain('new BoxGeometry(length, height, width)')
    expect(rendererSource).toContain('const cushionStart = segment.start + 0.03 + (pocketSide > 0 ? 0.025 : 0)')
    expect(rendererSource).toContain('const cushionEnd = segment.end - 0.03 - (pocketSide < 0 ? 0.025 : 0)')
    expect(rendererSource).toContain('const cushionCenter = (cushionStart + cushionEnd) / 2')
    expect(rendererSource).toContain('endRailLength - 0.06')
    expect(rendererSource).toContain('pocketJawDepth + 0.025')
    expect(rendererSource).toContain('railY + 0.035, 0.045, 0.035')
  })
})


describe('reference-matched table finish', () => {
  it('uses mahogany rails, vivid green cloth, and flush diamond sights', async () => {
    const rendererSource = readFileSync(
      new URL('../src/rendering/GameRenderer.ts', import.meta.url),
      'utf8',
    )
    expect(rendererSource).toContain("color: '#a33b2c'")
    expect(rendererSource).toContain("color: '#12a85a'")
    expect(rendererSource).toContain('addDiamondSight(sight')
    expect(rendererSource).toContain('new BoxGeometry(0.025, 0.006, 0.025)')
    expect(rendererSource).not.toContain('Math.random()')
  })
  it('uses rounded connected rails and removes harsh full-scene shadows', () => {
    const rendererSource = readFileSync(
      new URL('../src/rendering/GameRenderer.ts', import.meta.url),
      'utf8',
    )
    expect(rendererSource).toContain('new RoundedBoxGeometry')
    expect(rendererSource).toContain('this.addTableLegs(wood, halfLength, halfWidth)')
    expect(rendererSource).toContain('floor.position.y = -1.05')
    expect(rendererSource).toContain('new CylinderGeometry(0.03, 0.05, legHeight, 16)')
    expect(rendererSource).toContain('halfLength + 0.04')
    expect(rendererSource).toContain('halfWidth + 0.135')
    expect(rendererSource).toContain('leg.rotation.set(-zSign * splay, 0, xSign * splay)')
    expect(rendererSource).toContain('addCornerPocketCaps(railWood')
    expect(rendererSource).toContain('opening.absarc(0, 0, mouthRadius')
    expect(rendererSource).toContain('const outerRadius = 0.115')
    expect(rendererSource).not.toContain('Rounded diagonal corner assemblies')
    expect(rendererSource).toContain('this.renderer.shadowMap.enabled = false')
    expect(rendererSource).not.toContain('const outerTrim = new Mesh(new BoxGeometry(TABLE_LENGTH + 0.46')
  })

})
