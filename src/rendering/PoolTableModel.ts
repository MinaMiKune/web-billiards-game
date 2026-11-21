import {
  CanvasTexture,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  RepeatWrapping,
  DoubleSide,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from '../physics/PhysicsWorld'
import {
  CORNER_JAW_START_OFFSET,
  CORNER_POCKET_JAW_TIP_OFFSET,
  CORNER_POCKET_MOUTH_RADIUS,
  SIDE_JAW_START_OFFSET,
  SIDE_POCKET_JAW_TIP_OFFSET,
  SIDE_POCKET_MOUTH_RADIUS,
  getCornerJawSegments,
  getSideJawSegments,
} from '../physics/tableSpec'
import { getLongRailSegments } from './RailGeometry'
import {
  TABLE_BED_THICKNESS,
  createClothGeometry,
  createClothMarkingsGeometry,
  createPocketThroatGeometry,
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
  apronDepth: 0.11,
  apronOutset: 0.13,
  supportBlockDepth: 0.17,
  centreSupportZFraction: 0.36,
  crossBracePocketClearance: 0.012,
  floorY: -0.78,
  woodColor: '#8a6a3e',
  feltColor: '#1a7a4f',
  cushionColor: '#0a3d27',
  pocketJawColor: '#04110a',
} as const

const TABLE_LENGTH = DEFAULT_PHYSICS_CONFIG.tableLength
const TABLE_WIDTH = DEFAULT_PHYSICS_CONFIG.tableWidth
const HALF_LENGTH = TABLE_LENGTH / 2
const HALF_WIDTH = TABLE_WIDTH / 2
const BALL_RADIUS = DEFAULT_PHYSICS_CONFIG.ballRadius
const RAIL_HEIGHT = POOL_TABLE_VISUAL_SPEC.railHeight
const RAIL_DEPTH = POOL_TABLE_VISUAL_SPEC.railDepth
const RAIL_Y = RAIL_HEIGHT / 2
// Cushion noses sit exactly on the physics boundary line (half size minus
// ball radius), so a ball resting on a cushion visually touches the rubber.
const CUSHION_NOSE_TOP = 0.052
const CUSHION_BACK_TOP = 0.040
const CUSHION_BACK_OFFSET = 0.024
const JAW_HEIGHT = 0.046
// Rail/cushion geometry is derived from the shared physics table spec, so the
// visible gaps always line up with the simulated pocket jaws.
export const CORNER_RAIL_CLEARANCE = CORNER_JAW_START_OFFSET
export const SIDE_POCKET_JAW_INNER_X = SIDE_POCKET_JAW_TIP_OFFSET
export const CORNER_POCKET_JAW_INNER_OFFSET = CORNER_POCKET_JAW_TIP_OFFSET
export const SIDE_RAIL_GAP_HALF = SIDE_JAW_START_OFFSET

export function getPoolTableLongRailSegments() {
  return getLongRailSegments(HALF_LENGTH, SIDE_RAIL_GAP_HALF, CORNER_RAIL_CLEARANCE)
}

export function getPoolTableCrossBraceDepth(
  x: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): number {
  if (Math.abs(x) < 1e-9) {
    // The centre cross-bearer must stop before both side-pocket mouths.
    return config.tableWidth - 2 * (
      SIDE_POCKET_MOUTH_RADIUS + POOL_TABLE_VISUAL_SPEC.crossBracePocketClearance
    )
  }
  return config.tableWidth + 0.08
}

export function getPoolTableSupportPositions(
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): TableSupportPosition[] {
  const supportX = [-config.tableLength * 0.40, 0, config.tableLength * 0.40]
  const outerSupportZ = config.tableWidth / 2 + POOL_TABLE_VISUAL_SPEC.apronOutset
  const centreSupportZ = config.tableWidth * POOL_TABLE_VISUAL_SPEC.centreSupportZFraction
  return supportX.flatMap((x) => {
    // The middle pair sits inboard on the cross-bearers, clear of the side
    // pocket mouths; the four end legs remain below the outer apron.
    const supportZ = x === 0 ? centreSupportZ : outerSupportZ
    return [-supportZ, supportZ].map((z) => ({ x, z }))
  })
}

function createWoodTexture(maxAnisotropy: number): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the pool-table wood texture')

  // Warm light oak in the same family as the reference table (#8a6a3e), so
  // the rails read tan instead of the old near-black mahogany.
  const base = context.createLinearGradient(0, 0, 0, 512)
  base.addColorStop(0, '#7d5f38')
  base.addColorStop(0.18, '#a8845c')
  base.addColorStop(0.48, '#c39a6b')
  base.addColorStop(0.72, '#8a6a3e')
  base.addColorStop(1, '#63502c')
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
      ? 'rgba(62, 40, 18, 0.28)'
      : 'rgba(255, 224, 180, 0.12)'
    context.lineWidth = index % 4 === 0 ? 2 : 1
    context.stroke()
  }

  const sheen = context.createLinearGradient(0, 0, 0, 512)
  sheen.addColorStop(0, 'rgba(255, 236, 205, 0.10)')
  sheen.addColorStop(0.5, 'rgba(255, 236, 205, 0.012)')
  sheen.addColorStop(1, 'rgba(40, 22, 8, 0.18)')
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
  // ShapeGeometry UVs equal the shape's world-space meters, so size the
  // canvas to the cloth extents at 100 px/m to keep 1 texture px = 1 cm and
  // stop UV clamping from flattening the whole bed to the gradient border.
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the billiard-cloth texture')

  // Near-white green-tinted sheen: the felt material color (#1a7a4f) carries
  // the cloth green, so multiplying stays in the reference palette instead
  // of squaring into the old near-black felt.
  const cloth = context.createRadialGradient(128, 64, 8, 128, 64, 165)
  cloth.addColorStop(0, '#f4fff8')
  cloth.addColorStop(0.55, '#e9f6ee')
  cloth.addColorStop(1, '#cfe0d6')
  context.fillStyle = cloth
  context.fillRect(0, 0, 256, 128)

  // Reference-style vertical nap stripes (#ffffff09), spaced 0.0914 m
  // (= 2.54 m * 36/1000) starting at 0.061 m (= 2.54 m * 24/1000).
  context.fillStyle = 'rgba(255, 255, 255, 0.035)'
  for (let x = Math.round(0.061 * 100); x < 256; x += Math.round(0.0914 * 100)) {
    context.fillRect(x, 0, 1, 128)
  }

  // Fine woven nap noise, kept isotropic for the 1 cm pixel grid.
  for (let y = 0; y < 128; y += 2) {
    context.fillStyle = y % 4 === 0
      ? 'rgba(220, 255, 230, 0.03)'
      : 'rgba(0, 20, 12, 0.03)'
    context.fillRect(0, y, 256, 1)
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
  // Nothing here may rise above the cloth plane: a leather lip just below the
  // bed lines the mouth without ever bridging the playing surface.
  const linerRim = new Mesh(
    new TorusGeometry(mouthRadius * 0.96, 0.0045, 10, 48),
    leather,
  )
  linerRim.rotation.x = -Math.PI / 2
  linerRim.position.set(x, -0.006, z)
  linerRim.castShadow = false
  linerRim.receiveShadow = false
  group.add(linerRim)

  const throat = new Mesh(createPocketThroatGeometry(mouthRadius), leather)
  throat.position.set(x, -TABLE_BED_THICKNESS - 0.15, z)
  throat.castShadow = false
  throat.receiveShadow = false
  group.add(throat)

  // A second, narrower open-ended sleeve hangs below the slate. It has no
  // bottom cap, so a ball entering the pocket has a genuine open drop path.
  const bagMaterial = new MeshStandardMaterial({
    color: '#080a08',
    roughness: 0.98,
    metalness: 0,
    side: DoubleSide,
  })
  const bag = new Mesh(
    new CylinderGeometry(mouthRadius * 0.55, mouthRadius * 0.32, 0.16, 40, 2, true),
    bagMaterial,
  )
  bag.position.set(x, -TABLE_BED_THICKNESS - 0.30, z)
  bag.castShadow = false
  bag.receiveShadow = false
  group.add(bag)

  const bagLowerRim = new Mesh(
    new TorusGeometry(mouthRadius * 0.32, 0.0025, 6, 32),
    leather,
  )
  bagLowerRim.rotation.x = -Math.PI / 2
  bagLowerRim.position.set(x, -TABLE_BED_THICKNESS - 0.38, z)
  bagLowerRim.castShadow = false
  group.add(bagLowerRim)
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
  startWidth = 0.022,
  endWidth = 0.012,
): void {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const length = Math.hypot(dx, dz)
  if (length <= 1e-6) return

  // The physics collision segment is the inner face of this rubber wedge. The
  // wedge body extends away from the table center, tucked under the rail, so
  // the surface a ball bounces off is exactly the surface it sees.
  const midX = (start.x + end.x) / 2
  const midZ = (start.z + end.z) / 2
  let bodyX = dz / length
  let bodyZ = -dx / length
  if (bodyX * midX + bodyZ * midZ < 0) {
    bodyX = -bodyX
    bodyZ = -bodyZ
  }

  const shape = new Shape()
  shape.moveTo(start.x, -start.z)
  shape.lineTo(end.x, -end.z)
  shape.lineTo(end.x + bodyX * endWidth, -(end.z + bodyZ * endWidth))
  shape.lineTo(start.x + bodyX * startWidth, -(start.z + bodyZ * startWidth))
  shape.closePath()

  const geometry = new ExtrudeGeometry(shape, {
    depth: JAW_HEIGHT,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.0015,
    bevelThickness: 0.0015,
    curveSegments: 8,
  })
  geometry.rotateX(-Math.PI / 2)
  const jaw = new Mesh(geometry, material)
  jaw.position.y = 0.001
  jaw.castShadow = true
  jaw.receiveShadow = true
  group.add(jaw)
}

/**
 * Profiled cushion whose nose face sits exactly on the physics rail boundary
 * (half size minus ball radius). The vertical nose reaches above ball-contact
 * height and the top slopes back toward the rail, like a real L-profile
 * cushion rubber. The geometry is centered on the origin: profile x extends
 * behind the nose along +z, length runs along x.
 */
function createCushionGeometry(length: number): ExtrudeGeometry {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.lineTo(0, CUSHION_NOSE_TOP)
  shape.lineTo(CUSHION_BACK_OFFSET, CUSHION_BACK_TOP)
  shape.lineTo(CUSHION_BACK_OFFSET, 0)
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 4,
  })
  geometry.rotateY(-Math.PI / 2)
  geometry.translate(length / 2, 0, 0)
  return geometry
}

function addCushionRun(
  group: Group,
  material: MeshStandardMaterial,
  length: number,
  centerX: number,
  centerZ: number,
  rotationY: number,
): void {
  const cushion = new Mesh(createCushionGeometry(length), material)
  cushion.position.set(centerX, 0.001, centerZ)
  cushion.rotation.y = rotationY
  cushion.castShadow = true
  cushion.receiveShadow = true
  group.add(cushion)
}

function addPocketJawSet(
  group: Group,
  material: MeshStandardMaterial,
): void {
  for (const xSign of [-1, 1]) {
    for (const zSign of [-1, 1]) {
      for (const jaw of getCornerJawSegments(HALF_LENGTH, HALF_WIDTH, xSign, zSign)) {
        addCushionJawSegment(group, jaw.start, jaw.end, material)
      }
    }
  }
  for (const zSign of [-1, 1]) {
    for (const jaw of getSideJawSegments(HALF_WIDTH, zSign)) {
      addCushionJawSegment(group, jaw.start, jaw.end, material)
    }
  }
}

/**
 * Low wooden frame plate around each pocket. It closes the rail gap below the
 * cloth plane (its top stays 2 mm under the bed) so no background shows
 * through the pocket openings, while the mouth hole keeps the drop path open.
 */
function addPocketSurrounds(
  group: Group,
  frameWood: MeshStandardMaterial,
): void {
  const outerX = HALF_LENGTH + RAIL_DEPTH + 0.002
  const outerZ = HALF_WIDTH + RAIL_DEPTH + 0.002
  const innerGap = 0.028
  const pad = 0.006
  const depth = 0.046

  const buildPlate = (
    x0: number,
    x1: number,
    z0: number,
    z1: number,
    holeX: number,
    holeZ: number,
    holeRadius: number,
  ): void => {
    const shape = new Shape()
    shape.moveTo(x0, -z0)
    shape.lineTo(x1, -z0)
    shape.lineTo(x1, -z1)
    shape.lineTo(x0, -z1)
    shape.closePath()
    const hole = new Path()
    hole.absarc(holeX, -holeZ, holeRadius, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const geometry = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 40,
    })
    geometry.rotateX(-Math.PI / 2)
    const plate = new Mesh(geometry, frameWood)
    plate.position.y = -0.002 - depth
    plate.castShadow = false
    plate.receiveShadow = true
    group.add(plate)
  }

  for (const side of [-1, 1]) {
    const gapHalf = SIDE_RAIL_GAP_HALF + pad
    buildPlate(
      -gapHalf,
      gapHalf,
      Math.min(side * (HALF_WIDTH - innerGap), side * outerZ),
      Math.max(side * (HALF_WIDTH - innerGap), side * outerZ),
      0,
      side * HALF_WIDTH,
      SIDE_POCKET_MOUTH_RADIUS,
    )
    for (const xSign of [-1, 1]) {
      buildPlate(
        Math.min(xSign * (HALF_LENGTH - innerGap), xSign * outerX),
        Math.max(xSign * (HALF_LENGTH - innerGap), xSign * outerX),
        Math.min(side * (HALF_WIDTH - innerGap), side * outerZ),
        Math.max(side * (HALF_WIDTH - innerGap), side * outerZ),
        xSign * HALF_LENGTH,
        side * HALF_WIDTH,
        CORNER_POCKET_MOUTH_RADIUS,
      )
    }
  }
}

function addRailRuns(
  group: Group,
  railWood: MeshStandardMaterial,
  cushion: MeshStandardMaterial,
  pocketJaw: MeshStandardMaterial,
  frameWood: MeshStandardMaterial,
): void {
  const longSegments = getPoolTableLongRailSegments().map(({ start, end }) => [start, end] as const)

  const noseZ = HALF_WIDTH - BALL_RADIUS
  const noseX = HALF_LENGTH - BALL_RADIUS
  for (const side of [-1, 1]) {
    const railZ = side * (HALF_WIDTH + RAIL_DEPTH / 2 - 0.004)
    for (const [start, end] of longSegments) {
      const length = end - start
      const center = (start + end) / 2
      addRoundedBox(group, railWood, length, RAIL_HEIGHT, RAIL_DEPTH, center, RAIL_Y, railZ)
      addCushionRun(
        group,
        cushion,
        length,
        center,
        side * noseZ,
        side > 0 ? 0 : Math.PI,
      )
    }

    // End rails meet the long rails through open corner pockets.
    const endRailX = side * (HALF_LENGTH + RAIL_DEPTH / 2 - 0.004)
    const endLength = TABLE_WIDTH - 2 * CORNER_RAIL_CLEARANCE
    addRoundedBox(group, railWood, RAIL_DEPTH, RAIL_HEIGHT, endLength, endRailX, RAIL_Y, 0)
    addCushionRun(
      group,
      cushion,
      endLength,
      side * noseX,
      0,
      side > 0 ? Math.PI / 2 : -Math.PI / 2,
    )
  }

  addPocketJawSet(group, pocketJaw)
  addPocketSurrounds(group, frameWood)
}

function addApronAndSupports(
  group: Group,
  wood: MeshStandardMaterial,
  darkWood: MeshStandardMaterial,
  brass: MeshStandardMaterial,
): void {
  const apronHeight = POOL_TABLE_VISUAL_SPEC.apronHeight
  const apronDepth = POOL_TABLE_VISUAL_SPEC.apronDepth
  const apronY = -TABLE_BED_THICKNESS - apronHeight / 2 + 0.012
  const longApronZ = HALF_WIDTH + POOL_TABLE_VISUAL_SPEC.apronOutset
  const shortApronX = HALF_LENGTH + POOL_TABLE_VISUAL_SPEC.apronOutset
  const longApronLength = TABLE_LENGTH + 0.24
  const shortApronLength = TABLE_WIDTH + 0.24
  const supportBlockHeight = 0.105
  const supportBlockDepth = POOL_TABLE_VISUAL_SPEC.supportBlockDepth
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
      group, darkWood, 0.19, supportBlockHeight, supportBlockDepth,
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
    addRoundedBox(
      group,
      darkWood,
      0.09,
      0.065,
      getPoolTableCrossBraceDepth(x),
      x,
      bearerY,
      0,
      0.01,
    )
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
    color: '#8a6a3e',
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
  const pocketJaw = new MeshStandardMaterial({
    color: POOL_TABLE_VISUAL_SPEC.pocketJawColor,
    roughness: 0.86,
    metalness: 0,
  })
  const leather = new MeshStandardMaterial({
    color: '#050706',
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

  // Printed bed markings: head string, break "D", foot and head spots. They
  // share the physics coordinates (head string at -tableLength/4, foot spot
  // at the rack apex) so the visuals match the ruled lines exactly.
  const markings = new Mesh(
    createClothMarkingsGeometry(),
    new MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.30,
      depthWrite: false,
    }),
  )
  markings.rotation.x = -Math.PI / 2
  markings.position.y = 0.0016
  markings.castShadow = false
  markings.receiveShadow = false
  group.add(markings)

  addRailRuns(group, railWood, cushion, pocketJaw, darkWood)
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
