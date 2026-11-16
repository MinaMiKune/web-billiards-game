import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from 'three'
import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from '../physics/PhysicsWorld'

export const TABLE_BED_THICKNESS = 0.2
export const TABLE_BED_OUTER_MARGIN = DEFAULT_PHYSICS_CONFIG.pocketCaptureRadius + 0.016

function createPocketCutoutShape(
  config: PhysicsConfig,
  outerMargin: number,
): Shape {
  const halfLength = config.tableLength / 2
  const halfWidth = config.tableWidth / 2
  const pocketRadius = config.pocketCaptureRadius + 0.012
  const shape = new Shape()
  shape.moveTo(-halfLength - outerMargin, -halfWidth - outerMargin)
  shape.lineTo(halfLength + outerMargin, -halfWidth - outerMargin)
  shape.lineTo(halfLength + outerMargin, halfWidth + outerMargin)
  shape.lineTo(-halfLength - outerMargin, halfWidth + outerMargin)
  shape.closePath()

  const pocketCenters: Array<[number, number]> = [
    [-halfLength, -halfWidth], [0, -halfWidth], [halfLength, -halfWidth],
    [-halfLength, halfWidth], [0, halfWidth], [halfLength, halfWidth],
  ]
  for (const [x, z] of pocketCenters) {
    const opening = new Path()
    opening.absarc(x, -z, pocketRadius, 0, Math.PI * 2, true)
    shape.holes.push(opening)
  }
  return shape
}

/** Full-thickness wood slab with six through-holes aligned to the physics pockets. */
export function createTableBedGeometry(
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): ExtrudeGeometry {
  const geometry = new ExtrudeGeometry(
    createPocketCutoutShape(config, config.pocketCaptureRadius + 0.016),
    { depth: TABLE_BED_THICKNESS, bevelEnabled: false, curveSegments: 48 },
  )
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

/** Playing cloth uses the exact same six pocket centers and radii as the wood slab. */
export function createClothGeometry(
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): ShapeGeometry {
  const pocketRadius = config.pocketCaptureRadius + 0.012
  return new ShapeGeometry(
    createPocketCutoutShape(config, pocketRadius + 0.006),
    48,
  )
}
