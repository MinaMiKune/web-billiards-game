import { describe, expect, it } from 'vitest'
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three'
import { DEFAULT_PHYSICS_CONFIG } from '../src/physics/PhysicsWorld'
import { createClothGeometry, createTableBedGeometry } from '../src/rendering/TableGeometry'

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
  it('cuts six openings through the full wood bed slab', () => {
    const mesh = new Mesh(createTableBedGeometry(), new MeshBasicMaterial())
    mesh.position.y = -0.22

    for (const [x, z] of pocketCenters) {
      expect(rayHits(mesh, x, z), `wood slab should be open at pocket ${x}, ${z}`).toBe(false)
    }
    expect(rayHits(mesh, 0.35, 0), 'wood slab should remain solid beneath the cloth').toBe(true)
    mesh.geometry.dispose()
    mesh.material.dispose()
  })


  it('keeps the full ball-entry quadrant clear at every corner mouth', () => {
    const mesh = new Mesh(createTableBedGeometry(), new MeshBasicMaterial())
    mesh.position.y = -0.22
    const inset = DEFAULT_PHYSICS_CONFIG.pocketCaptureRadius * 0.62
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
