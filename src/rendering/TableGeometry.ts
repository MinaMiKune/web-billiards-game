import { ExtrudeGeometry, Path, Shape, ShapeGeometry } from 'three'
import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from '../physics/PhysicsWorld'

export const TABLE_BED_THICKNESS = 0.045
export const CORNER_POCKET_MOUTH_WIDTH = 0.1143
export const SIDE_POCKET_MOUTH_WIDTH = 0.127
export const CORNER_POCKET_MOUTH_RADIUS = CORNER_POCKET_MOUTH_WIDTH / 2
export const SIDE_POCKET_MOUTH_RADIUS = SIDE_POCKET_MOUTH_WIDTH / 2
export const TABLE_BED_OUTER_MARGIN = SIDE_POCKET_MOUTH_RADIUS + 0.016

function createPocketCutoutShape(
  config: PhysicsConfig,
  outerMargin: number,
): Shape {
  const halfLength = config.tableLength / 2
  const halfWidth = config.tableWidth / 2
  const sidePocketRadius = SIDE_POCKET_MOUTH_RADIUS
  const cornerPocketRadius = CORNER_POCKET_MOUTH_RADIUS
  const shape = new Shape()
  const outerHalfLength = halfLength + outerMargin
  const outerHalfWidth = halfWidth + outerMargin
  const cornerRadius = Math.min(0.065, outerMargin * 0.82)
  // Rounded outside corners replace the old sharp rectangular bed outline.
  shape.moveTo(-outerHalfLength + cornerRadius, -outerHalfWidth)
  shape.lineTo(outerHalfLength - cornerRadius, -outerHalfWidth)
  shape.quadraticCurveTo(outerHalfLength, -outerHalfWidth, outerHalfLength, -outerHalfWidth + cornerRadius)
  shape.lineTo(outerHalfLength, outerHalfWidth - cornerRadius)
  shape.quadraticCurveTo(outerHalfLength, outerHalfWidth, outerHalfLength - cornerRadius, outerHalfWidth)
  shape.lineTo(-outerHalfLength + cornerRadius, outerHalfWidth)
  shape.quadraticCurveTo(-outerHalfLength, outerHalfWidth, -outerHalfLength, outerHalfWidth - cornerRadius)
  shape.lineTo(-outerHalfLength, -outerHalfWidth + cornerRadius)
  shape.quadraticCurveTo(-outerHalfLength, -outerHalfWidth, -outerHalfLength + cornerRadius, -outerHalfWidth)
  shape.closePath()

  const pocketCenters: Array<[number, number]> = [
    [-halfLength, -halfWidth], [0, -halfWidth], [halfLength, -halfWidth],
    [-halfLength, halfWidth], [0, halfWidth], [halfLength, halfWidth],
  ]
  for (let index = 0; index < pocketCenters.length; index += 1) {
    const [x, z] = pocketCenters[index]
    const opening = new Path()
    const mouthRadius = index === 1 || index === 4 ? sidePocketRadius : cornerPocketRadius
    opening.absarc(x, -z, mouthRadius, 0, Math.PI * 2, true)
    shape.holes.push(opening)
  }
  return shape
}

/** Full-thickness wood slab with six through-holes aligned to the physics pockets. */
export function createTableBedGeometry(
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): ExtrudeGeometry {
  const geometry = new ExtrudeGeometry(
    createPocketCutoutShape(config, SIDE_POCKET_MOUTH_RADIUS + 0.016),
    { depth: TABLE_BED_THICKNESS, bevelEnabled: false, curveSegments: 48 },
  )
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

/** Playing cloth uses the exact same six pocket centers and radii as the wood slab. */
export function createClothGeometry(
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): ShapeGeometry {
  return new ShapeGeometry(
    createPocketCutoutShape(config, SIDE_POCKET_MOUTH_RADIUS + 0.006),
    48,
  )
}
