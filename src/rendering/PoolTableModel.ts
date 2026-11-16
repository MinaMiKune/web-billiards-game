import {
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from '../physics/PhysicsWorld'
import { getLongRailSegments } from './RailGeometry'
import {
  CORNER_POCKET_MOUTH_RADIUS,
  SIDE_POCKET_MOUTH_RADIUS,
  TABLE_BED_THICKNESS,
  createClothGeometry,
  createTableBedGeometry,
} from './TableGeometry'

export interface TableSupportPosition {
  x: number
  z: number
}

/**
 * Visual acceptance contract for the full-size (9 ft playing field) table.
 * These values intentionally describe real table construction rather than
 * implementation-specific mesh names.
 */
export const POOL_TABLE_VISUAL_SPEC = {
  pocketCount: 6,
  supportLegCount: 6,
  railHeight: 0.075,
  railDepth: 0.15,
  apronHeight: 0.18,
  floorY: -0.78,
  woodColor: '#75432f',
  feltColor: '#0d6842',
  cushionColor: '#113c2a',
} as const

const TABLE_LENGTH = DEFAULT_PHYSICS_CONFIG.tableLength
const TABLE_WIDTH = DEFAULT_PHYSICS_CONFIG.tableWidth
const HALF_LENGTH = TABLE_LENGTH / 2
const HALF_WIDTH = TABLE_WIDTH / 2
const RAIL_HEIGHT = POOL_TABLE_VISUAL_SPEC.railHeight
const RAIL_DEPTH = POOL_TABLE_VISUAL_SPEC.railDepth
const RAIL_Y = RAIL_HEIGHT / 2
export const CORNER_RAIL_CLEARANCE = CORNER_POCKET_MOUTH_RADIUS + 0.045
const SIDE_JAW_INNER_X = DEFAULT_PHYSICS_CONFIG.sidePocketHalfWidth + DEFAULT_PHYSICS_CONFIG.ballRadius
export const SIDE_RAIL_GAP_HALF = SIDE_JAW_INNER_X + DEFAULT_PHYSICS_CONFIG.pocketJawDepth

export function getPoolTableLongRailSegments() {
  return getLongRailSegments(HALF_LENGTH, SIDE_RAIL_GAP_HALF, CORNER_RAIL_CLEARANCE)
}

export function getPoolTableSupportPositions(
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): TableSupportPosition[] {
  const supportX = [-config.tableLength * 0.40, 0, config.tableLength * 0.40]
  const supportZ = config.tableWidth / 2 + 0.13
  return supportX.flatMap((x) => [-supportZ, supportZ].map((z) => ({ x, z })))
}

function createWoodTexture(maxAnisotropy: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the pool-table wood texture')

  const base = context.createLinearGradient(0, 0, 0, 512)
  base.addColorStop(0, '#24100b')
  base.addColorStop(0.18, '#63301f')
  base.addColorStop(0.48, '#7b402a')
  base.addColorStop(0.72, '#4b2117')
  base.addColorStop(1, '#1d0d09')
  context.fillStyle = base
  context.fillRect(0, 0, 1024, 512)

  // Deterministic, fine flowing grain; no random variation between devices.
  for (let index = 0; index < 190; index += 1) {
    const y = (index * 67) % 512
    const wave = (index % 9) * 1.8
    context.beginPath()
    context.moveTo(0, y)
    context.bezierCurveTo(
      270, y - 10 + wave,
      690, y + 13 - wave,
      1024, y + ((index % 7) - 3) * 2,
    )
    context.strokeStyle = index % 6 === 0
      ? 'rgba(18, 6, 3, 0.24)'
      : 'rgba(244, 190, 137, 0.10)'
    context.lineWidth = index % 4 === 0 ? 2 : 1
    context.stroke()
  }

  const sheen = context.createLinearGradient(0, 0, 0, 512)
  sheen.addColorStop(0, 'rgba(255, 226, 190, 0.13)')
  sheen.addColorStop(0.5, 'rgba(255, 226, 190, 0.015)')
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.23)')
  context.fillStyle = sheen
  context.fillRect(0, 0, 1024, 512)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.anisotropy = maxAnisotropy
  return texture
}

function createClothTexture(maxAnisotropy: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the billiard-cloth texture')

  const cloth = context.createRadialGradient(256, 256, 18, 256, 256, 390)
  cloth.addColorStop(0, '#13794b')
  cloth.addColorStop(0.7, '#0d6842')
  cloth.addColorStop(1, '#08462f')
  context.fillStyle = cloth
  context.fillRect(0, 0, 512, 512)

  // Subtle woven nap instead of the previous high-contrast checker pattern.
  for (let y = 0; y < 512; y += 2) {
    context.fillStyle = y % 4 === 0
      ? 'rgba(220, 255, 230, 0.025)'
      : 'rgba(0, 20, 12, 0.025)'
    context.fillRect(0, y, 512, 1)
  }
  for (let x = 0; x < 512; x += 4) {
    context.fillStyle = 'rgba(230, 255, 235, 0.018)'
    context.fillRect(x, 0, 1, 512)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = maxAnisotropy
  return texture
}

function addRoundedBox(
  group: Group,
  material: MeshStandardMaterial,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  radius = 0.012,
): Mesh {
  const safeRadius = Math.max(
    0.001,
    Math.min(radius, width * 0.12, height * 0.24, depth * 0.24),
  )
  const mesh = new Mesh(
    new RoundedBoxGeometry(width, height, depth, 5, safeRadius),
    material,
  )
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return mesh
}

function addPocketCollar(
  group: Group,
  x: number,
  z: number,
  mouthRadius: number,
  leather: MeshStandardMaterial,
): void {
  // The inner rim is deliberately outside the actual cut-out; it never bridges
  // the six openings in the cloth or slate bed.
  const collar = new Mesh(
    new TorusGeometry(mouthRadius + 0.010, 0.007, 10, 48),
    leather,
  )
  collar.rotation.x = -Math.PI / 2
  collar.position.set(x, 0.002, z)
  collar.castShadow = false
  collar.receiveShadow = false
  group.add(collar)

  const throat = new Mesh(
    new CylinderGeometry(mouthRadius * 0.82, mouthRadius * 0.48, 0.23, 40, 1, true),
    leather,
  )
  throat.position.set(x, -TABLE_BED_THICKNESS - 0.115, z)
  throat.castShadow = false
  throat.receiveShadow = false
  group.add(throat)

  addPocketBag(group, x, z, mouthRadius, leather)
}

function addPocketBag(
  group: Group,
  x: number,
  z: number,
  mouthRadius: number,
  leather: MeshStandardMaterial,
): void {
  const netMaterial = new MeshStandardMaterial({
    color: '#090807',
    roughness: 0.94,
    metalness: 0,
  })
  const topY = -TABLE_BED_THICKNESS - 0.01
  const middleY = topY - 0.105
  const bottomY = topY - 0.22
  const ringData = [
    { y: middleY, radius: mouthRadius * 0.59 },
    { y: bottomY, radius: mouthRadius * 0.39 },
  ]

  for (const ring of ringData) {
    const hoop = new Mesh(
      new TorusGeometry(ring.radius, 0.0032, 6, 28),
      leather,
    )
    hoop.rotation.x = -Math.PI / 2
    hoop.position.set(x, ring.y, z)
    hoop.castShadow = false
    hoop.visible = false
    group.add(hoop)
  }

  // Fine net cords taper into a compact hanging pocket bag.
  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const curve = new CatmullRomCurve3([
      new Vector3(x + cos * mouthRadius * 0.78, topY, z + sin * mouthRadius * 0.78),
      new Vector3(x + cos * ringData[0].radius, middleY, z + sin * ringData[0].radius),
      new Vector3(x + cos * ringData[1].radius, bottomY, z + sin * ringData[1].radius),
    ])
    const cord = new Mesh(new TubeGeometry(curve, 12, 0.0004, 4, false), netMaterial)
    cord.castShadow = false
    group.add(cord)
  }

  const pocketBottom = new Mesh(
    new CircleGeometry(mouthRadius * 0.38, 32),
    new MeshStandardMaterial({ color: '#080a08', roughness: 1, metalness: 0 }),
  )
  pocketBottom.rotation.x = -Math.PI / 2
  pocketBottom.position.set(x, bottomY - 0.006, z)
  pocketBottom.castShadow = false
  pocketBottom.receiveShadow = false
  group.add(pocketBottom)
}

function addDiamondSight(
  group: Group,
  x: number,
  z: number,
  material: MeshStandardMaterial,
): void {
  const half = 0.010
  const shape = new Shape()
  shape.moveTo(0, half)
  shape.lineTo(half, 0)
  shape.lineTo(0, -half)
  shape.lineTo(-half, 0)
  shape.closePath()
  const marker = new Mesh(new ShapeGeometry(shape), material)
  marker.rotation.x = -Math.PI / 2
  marker.position.set(x, RAIL_Y + RAIL_HEIGHT / 2 + 0.001, z)
  marker.castShadow = false
  marker.receiveShadow = false
  group.add(marker)
}

function addCushionJawSegment(
  group: Group,
  start: TableSupportPosition,
  end: TableSupportPosition,
  material: MeshStandardMaterial,
  startWidth = 0.026,
  endWidth = 0.010,
): void {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const length = Math.hypot(dx, dz)
  if (length <= 1e-6) return

  const perpendicularX = -dz / length
  const perpendicularZ = dx / length
  const startHalf = startWidth / 2
  const endHalf = endWidth / 2
  const points: Array<[number, number]> = [
    [start.x + perpendicularX * startHalf, start.z + perpendicularZ * startHalf],
    [end.x + perpendicularX * endHalf, end.z + perpendicularZ * endHalf],
    [end.x - perpendicularX * endHalf, end.z - perpendicularZ * endHalf],
    [start.x - perpendicularX * startHalf, start.z - perpendicularZ * startHalf],
  ]

  const shape = new Shape()
  shape.moveTo(points[0][0], -points[0][1])
  for (let index = 1; index < points.length; index += 1) {
    shape.lineTo(points[index][0], -points[index][1])
  }
  shape.closePath()

  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.039,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.002,
    bevelThickness: 0.002,
    curveSegments: 8,
  })
  geometry.rotateX(-Math.PI / 2)
  const jaw = new Mesh(geometry, material)
  jaw.position.y = 0.002
  jaw.castShadow = false
  jaw.receiveShadow = false
  group.add(jaw)
}

function addSidePocketJaw(
  group: Group,
  xSign: number,
  zSign: number,
  material: MeshStandardMaterial,
): void {
  // This is a narrow tapered rubber nose, not a broad triangular panel.
  // Its centerline follows the same 45-degree jaw segment used by the
  // collision solver, while the opening remains clear on the cloth side.
  const innerX = SIDE_JAW_INNER_X
  const outerX = SIDE_RAIL_GAP_HALF
  const jawInnerZ = HALF_WIDTH - DEFAULT_PHYSICS_CONFIG.pocketJawDepth
  addCushionJawSegment(
    group,
    { x: xSign * outerX, z: zSign * HALF_WIDTH },
    { x: xSign * innerX, z: zSign * jawInnerZ },
    material,
    0.016,
    0.006,
  )
}

function addCornerPocketJaws(
  group: Group,
  xSign: number,
  zSign: number,
  material: MeshStandardMaterial,
): void {
  const innerOffset = Math.max(
    0,
    DEFAULT_PHYSICS_CONFIG.pocketCaptureRadius - DEFAULT_PHYSICS_CONFIG.pocketJawDepth,
  )
  const innerTip = {
    x: xSign * (HALF_LENGTH - innerOffset),
    z: zSign * (HALF_WIDTH - innerOffset),
  }
  const longRailStart = {
    x: xSign * (HALF_LENGTH - CORNER_RAIL_CLEARANCE),
    z: zSign * HALF_WIDTH,
  }
  const endRailStart = {
    x: xSign * HALF_LENGTH,
    z: zSign * (HALF_WIDTH - CORNER_RAIL_CLEARANCE),
  }

  // Two rounded rubber noses converge toward the leather corner pocket.
  addCushionJawSegment(group, longRailStart, innerTip, material, 0.020, 0.006)
  addCushionJawSegment(group, endRailStart, innerTip, material, 0.020, 0.006)
}

function addRailRuns(
  group: Group,
  railWood: MeshStandardMaterial,
  cushion: MeshStandardMaterial,
): void {
  const longSegments = getPoolTableLongRailSegments().map(({ start, end }) => [start, end] as const)

  // Long rails: the cushion nose is on the cloth-facing edge, not outside it.
  for (const side of [-1, 1]) {
    const railZ = side * (HALF_WIDTH + RAIL_DEPTH / 2 - 0.004)
    const cushionZ = side * (HALF_WIDTH - 0.006)
    for (const [start, end] of longSegments) {
      const length = end - start
      const center = (start + end) / 2
      addRoundedBox(group, railWood, length, RAIL_HEIGHT, RAIL_DEPTH, center, RAIL_Y, railZ)
      addRoundedBox(
        group,
        cushion,
        Math.max(0.04, length - 0.018),
        0.039,
        0.036,
        center,
        0.022,
        cushionZ,
        0.007,
      )
    }

    for (const xSign of [-1, 1]) {
      addSidePocketJaw(group, xSign, side, cushion)
    }

    // End rails meet the long rails through open corner pockets.
    const endRailX = side * (HALF_LENGTH + RAIL_DEPTH / 2 - 0.004)
    const endCushionX = side * (HALF_LENGTH - 0.006)
    const endLength = TABLE_WIDTH - 2 * CORNER_RAIL_CLEARANCE
    addRoundedBox(group, railWood, RAIL_DEPTH, RAIL_HEIGHT, endLength, endRailX, RAIL_Y, 0)
    addRoundedBox(
      group,
      cushion,
      0.036,
      0.039,
      endLength - 0.018,
      endCushionX,
      0.022,
      0,
      0.007,
    )
  }
}

function addApronAndSupports(
  group: Group,
  wood: MeshStandardMaterial,
  darkWood: MeshStandardMaterial,
  brass: MeshStandardMaterial,
): void {
  const apronHeight = POOL_TABLE_VISUAL_SPEC.apronHeight
  const apronDepth = 0.11
  const apronY = -TABLE_BED_THICKNESS - apronHeight / 2 + 0.012
  const longApronZ = HALF_WIDTH + 0.105
  const shortApronX = HALF_LENGTH + 0.105
  const longApronLength = TABLE_LENGTH + 0.24
  const shortApronLength = TABLE_WIDTH + 0.24
  const supportBlockHeight = 0.105
  const supportBlockY = apronY + 0.005
  const legBottomY = POOL_TABLE_VISUAL_SPEC.floorY + 0.005
  const legHeight = supportBlockY - supportBlockHeight / 2 - legBottomY

  for (const side of [-1, 1]) {
    addRoundedBox(
      group, darkWood, longApronLength, apronHeight, apronDepth,
      0, apronY, side * longApronZ, 0.018,
    )
    addRoundedBox(
      group, darkWood, apronDepth, apronHeight, shortApronLength,
      side * shortApronX, apronY, 0, 0.018,
    )

    // Narrow polished moulding at the lower edge gives the apron a finished,
    // furniture-like profile without adding a slab beneath the pocket mouths.
    addRoundedBox(
      group, wood, longApronLength - 0.04, 0.018, apronDepth + 0.008,
      0, apronY - apronHeight / 2 + 0.028, side * longApronZ, 0.006,
    )
    addRoundedBox(
      group, wood, apronDepth + 0.008, 0.018, shortApronLength - 0.04,
      side * shortApronX, apronY - apronHeight / 2 + 0.028, 0, 0.006,
    )
  }

  const positions = getPoolTableSupportPositions()
  const legScale = legHeight / 0.64
  const legProfile = [
    [0.054, 0],
    [0.064, 0.035],
    [0.059, 0.075],
    [0.046, 0.13],
    [0.052, 0.19],
    [0.073, 0.245],
    [0.079, 0.29],
    [0.067, 0.34],
    [0.052, 0.405],
    [0.048, 0.49],
    [0.059, 0.555],
    [0.071, 0.64],
  ].map(([radius, height]) => new Vector2(radius, height * legScale))
  const legGeometry = new LatheGeometry(legProfile, 28)
  legGeometry.computeVertexNormals()

  for (const position of positions) {
    const supportBlock = addRoundedBox(
      group, darkWood, 0.19, supportBlockHeight, 0.17,
      position.x, supportBlockY, position.z, 0.018,
    )
    supportBlock.castShadow = true

    const leg = new Mesh(legGeometry.clone(), wood)
    leg.position.set(position.x, legBottomY, position.z)
    leg.castShadow = true
    leg.receiveShadow = true
    group.add(leg)

    const footRing = new Mesh(
      new CylinderGeometry(0.062, 0.062, 0.024, 24),
      brass,
    )
    footRing.position.set(position.x, legBottomY + 0.025, position.z)
    footRing.castShadow = true
    group.add(footRing)

    const foot = new Mesh(
      new CylinderGeometry(0.052, 0.052, 0.026, 24),
      darkWood,
    )
    foot.position.set(position.x, legBottomY + 0.008, position.z)
    foot.castShadow = true
    group.add(foot)
  }

  // Slate bearers sit immediately below the 45 mm bed and connect directly
  // to the six leg blocks through three full-width cross braces.
  const bearerY = -TABLE_BED_THICKNESS - 0.035
  addRoundedBox(group, darkWood, TABLE_LENGTH - 0.18, 0.075, 0.11, 0, bearerY, 0, 0.012)
  for (const x of [-TABLE_LENGTH * 0.40, 0, TABLE_LENGTH * 0.40]) {
    addRoundedBox(group, darkWood, 0.09, 0.065, TABLE_WIDTH + 0.08, x, bearerY, 0, 0.01)
  }
}

export function createPoolTableModel(maxAnisotropy = 4): Group {
  const group = new Group()
  group.name = 'reference-faithful-pool-table'

  const woodTexture = createWoodTexture(maxAnisotropy)
  const clothTexture = createClothTexture(maxAnisotropy)
  const wood = new MeshStandardMaterial({
    color: POOL_TABLE_VISUAL_SPEC.woodColor,
    map: woodTexture,
    roughness: 0.31,
    metalness: 0.025,
  })
  const darkWood = new MeshStandardMaterial({
    color: '#95664d',
    map: woodTexture,
    roughness: 0.34,
    metalness: 0.02,
  })
  const railWood = new MeshStandardMaterial({
    color: '#d0a286',
    map: woodTexture,
    roughness: 0.27,
    metalness: 0.025,
  })
  const felt = new MeshStandardMaterial({
    color: POOL_TABLE_VISUAL_SPEC.feltColor,
    map: clothTexture,
    roughness: 0.96,
    metalness: 0,
  })
  const cushion = new MeshStandardMaterial({
    color: POOL_TABLE_VISUAL_SPEC.cushionColor,
    roughness: 0.82,
    metalness: 0,
  })
  const leather = new MeshStandardMaterial({
    color: '#171310',
    roughness: 0.88,
    metalness: 0.015,
  })
  const sightMaterial = new MeshStandardMaterial({
    color: '#e4d2a5',
    roughness: 0.42,
    metalness: 0.08,
  })
  const brass = new MeshStandardMaterial({
    color: '#95764a',
    roughness: 0.34,
    metalness: 0.58,
  })

  const bed = new Mesh(createTableBedGeometry(), wood)
  bed.position.y = -TABLE_BED_THICKNESS
  bed.castShadow = true
  bed.receiveShadow = true
  group.add(bed)

  const cloth = new Mesh(createClothGeometry(), felt)
  cloth.rotation.x = -Math.PI / 2
  cloth.position.y = 0.001
  cloth.receiveShadow = true
  group.add(cloth)

  addRailRuns(group, railWood, cushion)
  for (const xSign of [-1, 1]) {
    for (const zSign of [-1, 1]) {
      addCornerPocketJaws(group, xSign, zSign, cushion)
    }
  }
  addApronAndSupports(group, wood, darkWood, brass)

  const pocketPositions: Array<{ x: number; z: number; radius: number }> = [
    { x: -HALF_LENGTH, z: -HALF_WIDTH, radius: CORNER_POCKET_MOUTH_RADIUS },
    { x: 0, z: -HALF_WIDTH, radius: SIDE_POCKET_MOUTH_RADIUS },
    { x: HALF_LENGTH, z: -HALF_WIDTH, radius: CORNER_POCKET_MOUTH_RADIUS },
    { x: -HALF_LENGTH, z: HALF_WIDTH, radius: CORNER_POCKET_MOUTH_RADIUS },
    { x: 0, z: HALF_WIDTH, radius: SIDE_POCKET_MOUTH_RADIUS },
    { x: HALF_LENGTH, z: HALF_WIDTH, radius: CORNER_POCKET_MOUTH_RADIUS },
  ]

  for (const pocket of pocketPositions) {
    addPocketCollar(group, pocket.x, pocket.z, pocket.radius, leather)
  }

  // Small flush inlays follow the rail perimeter and never enter the pocket gaps.
  const sightX = [-1.08, -0.72, -0.36, 0.36, 0.72, 1.08]
  for (const side of [-1, 1]) {
    for (const x of sightX) {
      addDiamondSight(group, x, side * (HALF_WIDTH + RAIL_DEPTH / 2 - 0.004), sightMaterial)
    }
    for (const z of [-0.32, 0, 0.32]) {
      addDiamondSight(group, side * (HALF_LENGTH + RAIL_DEPTH / 2 - 0.004), z, sightMaterial)
    }
  }

  return group
}
