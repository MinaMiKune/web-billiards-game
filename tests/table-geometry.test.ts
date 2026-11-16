import { describe, expect, it } from 'vitest'
import { CylinderGeometry, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { DEFAULT_PHYSICS_CONFIG } from '../src/physics/PhysicsWorld'
import { CORNER_POCKET_MOUTH_RADIUS, SIDE_POCKET_MOUTH_RADIUS, TABLE_BED_THICKNESS, createClothGeometry, createPocketThroatGeometry, createTableBedGeometry } from '../src/rendering/TableGeometry'

const halfLength = DEFAULT_PHYSICS_CONFIG.tableLength / 2
const halfWidth = DEFAULT_PHYSICS_CONFIG.tableWidth / 2
const pocketCenters: Array<[number, number]> = [
  [-halfLength, -halfWidth], [0, -halfWidth], [halfLength, -halfWidth],
  [-halfLength, halfWidth], [0, halfWidth], [halfLength, halfWidth],
]

function rayHits(mesh: Mesh, x: number, z: number): boolean {
  mesh.updateMatrixWorld(true)
  const raycaster = new Raycaster(
    new Vector3(x, 1, z),
    new Vector3(0, -1, 0),
    0,
    2,
  )
  return raycaster.intersectObject(mesh, false).length > 0
}

describe('table pocket cutout geometry', () => {
  it('uses a realistic 45 mm bed slab and cuts six through-openings', () => {
    expect(TABLE_BED_THICKNESS).toBe(0.045)
    const mesh = new Mesh(createTableBedGeometry(), new MeshBasicMaterial())
    mesh.position.y = -TABLE_BED_THICKNESS

    for (const [x, z] of pocketCenters) {
      expect(rayHits(mesh, x, z), `wood slab should be open at pocket ${x}, ${z}`).toBe(false)
    }
    expect(rayHits(mesh, 0.35, 0), 'wood slab should remain solid beneath the cloth').toBe(true)
    mesh.geometry.dispose()
    mesh.material.dispose()
  })


  it('keeps the full ball-entry quadrant clear at every corner mouth', () => {
    const mesh = new Mesh(createTableBedGeometry(), new MeshBasicMaterial())
    mesh.position.y = -TABLE_BED_THICKNESS
    const inset = CORNER_POCKET_MOUTH_RADIUS * 0.58
    for (const xSign of [-1, 1]) {
      for (const zSign of [-1, 1]) {
        const x = xSign * (halfLength - inset)
        const z = zSign * (halfWidth - inset)
        expect(rayHits(mesh, x, z), `wood must not bridge corner entry ${xSign}, ${zSign}`).toBe(false)
      }
    }
    mesh.geometry.dispose()
    mesh.material.dispose()
  })

  it('uses regulation-sized corner and side pocket mouths', () => {
    const mesh = new Mesh(createTableBedGeometry(), new MeshBasicMaterial())
    mesh.position.y = -TABLE_BED_THICKNESS
    // Corner mouth is 4.5in wide; side mouth is 5in wide.
    expect(rayHits(mesh, halfLength - 0.035, halfWidth - 0.035)).toBe(false)
    expect(rayHits(mesh, halfLength - 0.052, halfWidth - 0.052)).toBe(true)
    expect(rayHits(mesh, 0.045, halfWidth - 0.02)).toBe(false)
    expect(rayHits(mesh, 0.068, halfWidth - 0.02)).toBe(true)
    expect(CORNER_POCKET_MOUTH_RADIUS).toBeCloseTo(0.05715, 5)
    expect(SIDE_POCKET_MOUTH_RADIUS).toBeCloseTo(0.0635, 5)
    mesh.geometry.dispose()
    mesh.material.dispose()
  })

  it('keeps every pocket throat genuinely open at its lower end', () => {
    for (const radius of [CORNER_POCKET_MOUTH_RADIUS, SIDE_POCKET_MOUTH_RADIUS]) {
      const throatGeometry = createPocketThroatGeometry(radius)
      expect(throatGeometry).toBeInstanceOf(CylinderGeometry)
      expect(throatGeometry.parameters.openEnded).toBe(true)
      const throat = new Mesh(throatGeometry, new MeshBasicMaterial())
      throat.updateMatrixWorld(true)
      const centreRay = new Raycaster(
        new Vector3(0, 0.5, 0),
        new Vector3(0, -1, 0),
        0,
        1,
      )
      expect(centreRay.intersectObject(throat, false)).toHaveLength(0)
      throat.geometry.dispose()
      throat.material.dispose()
    }
  })

  it('cuts the same six openings through the playing cloth', () => {
    const mesh = new Mesh(createClothGeometry(), new MeshBasicMaterial())
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = -0.015

    for (const [x, z] of pocketCenters) {
      expect(rayHits(mesh, x, z), `cloth should be open at pocket ${x}, ${z}`).toBe(false)
    }
    expect(rayHits(mesh, 0.35, 0), 'cloth should remain solid over the playing field').toBe(true)
    mesh.geometry.dispose()
    mesh.material.dispose()
  })
})
