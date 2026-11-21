import { CylinderGeometry, ExtrudeGeometry, Path, Shape, ShapeGeometry } from 'three'
import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from '../physics/PhysicsWorld'
import {
  CORNER_POCKET_MOUTH_RADIUS,
  CORNER_POCKET_MOUTH_WIDTH,
  FOOT_SPOT_X,
  SIDE_POCKET_MOUTH_RADIUS,
  SIDE_POCKET_MOUTH_WIDTH,
} from '../physics/tableSpec'

export const TABLE_BED_THICKNESS = 0.045
export {
  CORNER_POCKET_MOUTH_RADIUS,
  CORNER_POCKET_MOUTH_WIDTH,
  SIDE_POCKET_MOUTH_RADIUS,
  SIDE_POCKET_MOUTH_WIDTH,
}
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


/**
 * Open-ended throat under a pocket mouth. Both ends remain open; the bag is
 * a hanging cavity, never a flat disk that visually seals the pocket.
 */
export function createPocketThroatGeometry(mouthRadius: number): CylinderGeometry {
  return new CylinderGeometry(
    mouthRadius * 0.86,
    mouthRadius * 0.55,
    0.30,
    48,
    2,
    true,
  )
}

/**
 * Printed cloth markings, same coordinate system as the cloth itself (x/z
 * plane, rendered with rotation.x = -Math.PI/2):
 *   - head string at x = -tableLength/4, matching the behind-head-string
 *     placement zone enforced by the physics rules,
 *   - "D" break arc opening toward the rack, sized like the reference table
 *     (radius ~ 0.07 * table width),
 *   - foot spot dot at the rack apex and a head spot dot on the head string.
 */
export function createClothMarkingsGeometry(
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): ShapeGeometry {
  const halfWidth = config.tableWidth / 2
  const headStringX = -config.tableLength / 4
  const arcRadius = config.tableWidth * 0.07
  const lineHalfWidth = 0.002
  const inset = config.tableWidth * 0.02
  const spotRadius = 0.007
  const shapes: Shape[] = []

  const headString = new Shape()
  headString.moveTo(headStringX - lineHalfWidth, -(halfWidth - inset))
  headString.lineTo(headStringX + lineHalfWidth, -(halfWidth - inset))
  headString.lineTo(headStringX + lineHalfWidth, halfWidth - inset)
  headString.lineTo(headStringX - lineHalfWidth, halfWidth - inset)
  headString.closePath()
  shapes.push(headString)

  // Thin annular half-ring tracing the break "D" toward the rack, built from
  // sampled outer/inner semicircles so no hole winding is involved.
  const band = 0.0018
  const arc = new Shape()
  const arcSegments = 32
  for (let i = 0; i <= arcSegments; i += 1) {
    const theta = -Math.PI / 2 + (i / arcSegments) * Math.PI
    const px = headStringX + Math.cos(theta) * (arcRadius + band)
    const py = Math.sin(theta) * (arcRadius + band)
    if (i === 0) arc.moveTo(px, py)
    else arc.lineTo(px, py)
  }
  for (let i = arcSegments; i >= 0; i -= 1) {
    const theta = -Math.PI / 2 + (i / arcSegments) * Math.PI
    arc.lineTo(
      headStringX + Math.cos(theta) * (arcRadius - band),
      Math.sin(theta) * (arcRadius - band),
    )
  }
  arc.closePath()
  shapes.push(arc)

  for (const spotX of [headStringX, FOOT_SPOT_X]) {
    const spot = new Shape()
    spot.absarc(spotX, 0, spotRadius, 0, Math.PI * 2, false)
    shapes.push(spot)
  }

  return new ShapeGeometry(shapes, 24)
}
