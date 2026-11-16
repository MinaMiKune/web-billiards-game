import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Shape,
  ShapeGeometry,
  Path,
  SpotLight,
  Vector3,
  WebGLRenderer,
  SRGBColorSpace,
} from 'three'
import type { Camera } from 'three'
import type { Material } from 'three'
import { DEFAULT_PHYSICS_CONFIG } from '../physics/PhysicsWorld'
import type { RenderBall, Vec2 } from '../physics/PhysicsWorld'

const TABLE_LENGTH = DEFAULT_PHYSICS_CONFIG.tableLength
const TABLE_WIDTH = DEFAULT_PHYSICS_CONFIG.tableWidth

function disposeMaterials(material: Material | Material[]): void {
  const materials = Array.isArray(material) ? material as Material[] : [material as Material]
  for (const entry of materials) entry.dispose()
}

export class GameRenderer {
  readonly renderer: WebGLRenderer
  readonly scene = new Scene()
  private readonly ballMeshes = new Map<string, Mesh<SphereGeometry, MeshStandardMaterial>>()
  private readonly ballTextures = new Map<string, CanvasTexture>()
  private readonly aimLine: Line
  private readonly cueLine: Line
  private readonly cueStick = new Group()
  private readonly ballShadows = new Map<string, Mesh<CircleGeometry, MeshBasicMaterial>>()

  constructor(host: HTMLElement) {
    this.scene.background = new Color('#111e19')
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.renderer.shadowMap.enabled = true
    this.renderer.setSize(host.clientWidth, host.clientHeight, false)
    this.renderer.domElement.setAttribute('aria-label', '3D pool table. Drag backwards from the cue ball to aim and release to shoot.')
    this.renderer.domElement.tabIndex = 0
    host.append(this.renderer.domElement)

    this.addLighting()
    this.addEnvironment()
    this.addTable()

    const aimMaterial = new LineBasicMaterial({ color: '#f3e2b8', transparent: true, opacity: 0.62 })
    const cueMaterial = new LineBasicMaterial({ color: '#d8bd88', transparent: true, opacity: 0.95 })
    this.aimLine = new Line(new BufferGeometry(), aimMaterial)
    this.cueLine = new Line(new BufferGeometry(), cueMaterial)
    this.aimLine.visible = false
    this.cueLine.visible = false
    this.cueLine.visible = false
    this.createCueStick()
    this.scene.add(this.aimLine, this.cueLine, this.cueStick)
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false)
  }

  updateBalls(balls: RenderBall[]): void {
    for (const ball of balls) {
      let mesh = this.ballMeshes.get(ball.id)
      if (!mesh) {
        const geometry = new SphereGeometry(ball.radius, 32, 24)
        const texture = this.createBallTexture(ball.number, ball.color)
        const material = new MeshStandardMaterial({
          map: texture,
          roughness: 0.22,
          metalness: 0.01,
        })
        mesh = new Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.ballMeshes.set(ball.id, mesh)
        this.scene.add(mesh)
        const shadow = new Mesh(new CircleGeometry(ball.radius * 1.65, 32), new MeshBasicMaterial({ color: '#06100d', transparent: true, opacity: 0.24, depthWrite: false }))
        shadow.rotation.x = -Math.PI / 2
        shadow.position.y = 0.002
        shadow.renderOrder = 1
        this.ballShadows.set(ball.id, shadow)
        this.scene.add(shadow)
      }

      const isDropping = ball.pocketed
      const progress = ball.pocketProgress
      mesh.visible = ball.active || (isDropping && progress < 1)

      const renderX = isDropping && ball.pocketTarget
        ? ball.position.x + (ball.pocketTarget.x - ball.position.x) * progress * 0.72
        : ball.position.x
      const renderZ = isDropping && ball.pocketTarget
        ? ball.position.z + (ball.pocketTarget.z - ball.position.z) * progress * 0.72
        : ball.position.z
      const renderY = ball.radius + ball.height - progress * 0.22
      const renderScale = isDropping ? 1 - progress * 0.62 : 1

      mesh.position.set(renderX, renderY, renderZ)
      mesh.scale.setScalar(renderScale)
      mesh.rotation.set(ball.rotation.x, ball.rotation.y, ball.rotation.z)
      const shadow = this.ballShadows.get(ball.id)
      if (shadow) {
        shadow.position.set(renderX + 0.012, 0.002, renderZ - 0.012)
        shadow.scale.setScalar((isDropping ? renderScale : 1) * (1 + ball.height * 4))
        shadow.material.opacity = (isDropping ? 0.24 * (1 - progress) : 0.24) / (1 + ball.height * 8)
      }
    }
  }

  setAimPreview(cue: RenderBall, direction: { x: number; z: number }, pull: number, visible: boolean, elevation = 0): void {
    this.aimLine.visible = visible
    this.cueLine.visible = false
    this.cueStick.visible = visible
    if (!visible) return

    const dx = direction.x
    const dz = direction.z
    const start = new Vector3(cue.position.x + dx * 0.04, cue.radius + cue.height + 0.006, cue.position.z + dz * 0.04)
    const end = new Vector3(cue.position.x + dx * 1.1, cue.radius + cue.height + 0.006, cue.position.z + dz * 1.1)
    const cueStart = new Vector3(cue.position.x - dx * 0.11, cue.radius + cue.height + 0.02, cue.position.z - dz * 0.11)
    const cueEnd = new Vector3(
      cue.position.x - dx * (0.32 + pull * 0.55),
      cue.radius + cue.height + 0.02,
      cue.position.z - dz * (0.32 + pull * 0.55),
    )

    this.aimLine.geometry.dispose()
    this.cueLine.geometry.dispose()
    this.aimLine.geometry = new BufferGeometry().setFromPoints([start, end])
    this.cueLine.geometry = new BufferGeometry().setFromPoints([cueStart, cueEnd])
    const pullBack = 0.32 + pull * 0.55
    const cueAxis = new Vector3(dx * Math.cos(elevation), Math.sin(elevation), dz * Math.cos(elevation)).normalize()
    this.cueStick.position.set(
      cue.position.x - dx * (pullBack + 0.95),
      cue.radius + cue.height + 0.018 - Math.sin(elevation) * (pullBack + 0.95),
      cue.position.z - dz * (pullBack + 0.95),
    )
    this.cueStick.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), cueAxis)
  }

  render(camera: Camera): void {
    this.renderer.render(this.scene, camera)
  }

  dispose(): void {
    this.aimLine.geometry.dispose()
    disposeMaterials(this.aimLine.material)
    this.cueLine.geometry.dispose()
    disposeMaterials(this.cueLine.material)
    this.renderer.dispose()
    this.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose()
        const material = object.material
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else {
          material.map?.dispose()
          material.dispose()
        }
      }
    })
    this.ballTextures.clear()
    for (const shadow of this.ballShadows.values()) { shadow.geometry.dispose(); shadow.material.dispose() }
    this.ballShadows.clear()
  }

  private createBallTexture(number: number, color: string): CanvasTexture {
    const key = number + ':' + color
    const cached = this.ballTextures.get(key)
    if (cached) return cached

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create a canvas texture for a billiards ball')

    const striped = number >= 9
    context.fillStyle = striped ? '#f6f2e8' : color
    context.fillRect(0, 0, canvas.width, canvas.height)

    if (striped) {
      context.fillStyle = color
      context.fillRect(0, 82, canvas.width, 92)
    }

    if (number > 0) {
      context.beginPath()
      context.arc(256, 128, 49, 0, Math.PI * 2)
      context.fillStyle = '#faf8ee'
      context.fill()
      context.fillStyle = '#111512'
      context.font = 'bold 54px Arial, sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(String(number), 256, 130)
    }

    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    this.ballTextures.set(key, texture)
    return texture
  }

  private addLighting(): void {
    this.scene.add(new AmbientLight('#c5d4c8', 1.2))

    const key = new DirectionalLight('#fff0d0', 2.35)
    key.position.set(-2.8, 5.4, 3.2)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3.5
    key.shadow.camera.right = 3.5
    key.shadow.camera.top = 3
    key.shadow.camera.bottom = -3
    this.scene.add(key)

    // Soft overhead pool-hall light keeps the cloth and numbered balls readable
    // across the top, angled and side cameras without changing physics state.
    const overhead = new SpotLight('#f6e8c9', 1.15, 9, 0.48, 0.68, 1.5)
    overhead.position.set(0, 5.4, 0)
    overhead.target.position.set(0, 0, 0)
    overhead.castShadow = true
    overhead.shadow.mapSize.set(1024, 1024)
    overhead.shadow.camera.near = 0.5
    overhead.shadow.camera.far = 9
    overhead.shadow.bias = -0.00015
    this.scene.add(overhead, overhead.target)

    const fill = new DirectionalLight('#7fae9a', 0.72)
    fill.position.set(3.5, 2.5, -3)
    this.scene.add(fill)
  }

  private addEnvironment(): void {
    const floor = new Mesh(
      new PlaneGeometry(30, 30),
      new MeshStandardMaterial({ color: '#101b17', roughness: 0.95 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.27
    floor.receiveShadow = true
    this.scene.add(floor)
  }

  private addTable(): void {
    const wood = new MeshStandardMaterial({ color: '#9a6840', map: this.createSurfaceTexture('wood'), roughness: 0.3 })
    const railWood = new MeshStandardMaterial({ color: '#a8794c', map: this.createSurfaceTexture('wood'), roughness: 0.28 })
    const cushion = new MeshStandardMaterial({ color: '#174b3a', roughness: 0.88 })
    const felt = new MeshStandardMaterial({ color: '#176447', map: this.createSurfaceTexture('felt'), roughness: 0.94 })
    const pocket = new MeshStandardMaterial({ color: '#080c0b', roughness: 1 })
    const pocketRim = new MeshStandardMaterial({ color: '#bd9b60', roughness: 0.45, metalness: 0.3 })

    const body = new Mesh(new BoxGeometry(TABLE_LENGTH + 0.42, 0.2, TABLE_WIDTH + 0.42), wood)
    body.position.y = -0.12
    body.castShadow = true
    body.receiveShadow = true
    this.scene.add(body)

    // Build the cloth as a true cut-out shape. A full rectangle with black
    // discs painted over it looks like a blocked pocket and leaves no visual
    // opening in oblique views.
    const halfLength = TABLE_LENGTH / 2
    const halfWidth = TABLE_WIDTH / 2
    const feltShape = new Shape()
    feltShape.moveTo(-halfLength, -halfWidth)
    feltShape.lineTo(halfLength, -halfWidth)
    feltShape.lineTo(halfLength, halfWidth)
    feltShape.lineTo(-halfLength, halfWidth)
    feltShape.closePath()
    const pocketRadius = Math.max(DEFAULT_PHYSICS_CONFIG.pocketCaptureRadius * 0.82, DEFAULT_PHYSICS_CONFIG.ballRadius * 1.45)
    const pocketCenters: Array<[number, number]> = [
      [-halfLength, -halfWidth], [0, -halfWidth], [halfLength, -halfWidth],
      [-halfLength, halfWidth], [0, halfWidth], [halfLength, halfWidth],
    ]
    for (const [x, z] of pocketCenters) {
      const cutout = new Path()
      cutout.absarc(x, -z, pocketRadius, 0, Math.PI * 2, true)
      feltShape.holes.push(cutout)
    }
    const feltMesh = new Mesh(new ShapeGeometry(feltShape, 48), felt)
    feltMesh.rotation.x = -Math.PI / 2
    feltMesh.position.y = -0.015
    feltMesh.receiveShadow = true
    this.scene.add(feltMesh)

    const headStringGeometry = new BufferGeometry().setFromPoints([
      new Vector3(-TABLE_LENGTH / 4, -0.013, -TABLE_WIDTH / 2 + 0.025),
      new Vector3(-TABLE_LENGTH / 4, -0.013, TABLE_WIDTH / 2 - 0.025),
    ])
    const headString = new Line(
      headStringGeometry,
      new LineBasicMaterial({ color: '#d7c49a', transparent: true, opacity: 0.5 }),
    )
    this.scene.add(headString)

    const halfL = TABLE_LENGTH / 2
    const halfW = TABLE_WIDTH / 2
    const railHeight = 0.13
    const railDepth = 0.14
    const railY = 0.045
    const sideJawInnerX = DEFAULT_PHYSICS_CONFIG.sidePocketHalfWidth +
      DEFAULT_PHYSICS_CONFIG.ballRadius
    const sideJawOuterX = sideJawInnerX + DEFAULT_PHYSICS_CONFIG.pocketJawDepth
    const longSegmentLength = halfL - sideJawOuterX

    for (const side of [-1, 1]) {
      for (const segmentCenter of [-(halfL - longSegmentLength / 2), halfL - longSegmentLength / 2]) {
        this.addBox(railWood, longSegmentLength, railHeight, railDepth, segmentCenter, railY, side * (halfW + 0.065))
        this.addBox(cushion, longSegmentLength, 0.045, 0.035, segmentCenter, railY + 0.035, side * (halfW + 0.005))
      }

      this.addBox(railWood, railDepth, railHeight, TABLE_WIDTH - 0.24, side * (halfL + 0.065), railY, 0)
      this.addBox(cushion, 0.035, 0.045, TABLE_WIDTH - 0.24, side * (halfL + 0.005), railY + 0.035, 0)
    }

    this.addPocketJaws(railWood, cushion, halfL, halfW, railY)

    const pocketPositions = [
      [-halfL, -halfW], [0, -halfW], [halfL, -halfW],
      [-halfL, halfW], [0, halfW], [halfL, halfW],
    ]

    for (const [x, z] of pocketPositions) {
      // The well sits below the cloth opening; no disc or raised rim overlaps
      // the playable surface, so a ball can visibly enter from the table edge.
      const drop = new Mesh(new CylinderGeometry(pocketRadius, pocketRadius * 0.72, 0.085, 40), pocket)
      drop.position.set(x, -0.072, z)
      drop.receiveShadow = true
      this.scene.add(drop)
    }

    const outerTrim = new Mesh(new BoxGeometry(TABLE_LENGTH + 0.46, 0.035, TABLE_WIDTH + 0.46), railWood)
    outerTrim.position.y = -0.225
    this.scene.add(outerTrim)
  }


  private createCueStick(): void {
    const shaft = new Mesh(new CylinderGeometry(0.0032, 0.0082, 0.86, 16, 1), new MeshStandardMaterial({ color: '#d8b47c', roughness: 0.34 }))
    shaft.position.y = 0.48
    const butt = new Mesh(new CylinderGeometry(0.0082, 0.012, 0.34, 20, 1), new MeshStandardMaterial({ color: '#5a301c', roughness: 0.3 }))
    butt.position.y = -0.12
    const wrap = new Mesh(new CylinderGeometry(0.0105, 0.0105, 0.19, 20, 1), new MeshStandardMaterial({ color: '#202522', roughness: 0.82 }))
    wrap.position.y = -0.12
    const ferrule = new Mesh(new CylinderGeometry(0.0038, 0.0042, 0.035, 16), new MeshStandardMaterial({ color: '#e9dfc5', roughness: 0.24 }))
    ferrule.position.y = 0.915
    const tip = new Mesh(new CylinderGeometry(0.0032, 0.0038, 0.018, 16), new MeshStandardMaterial({ color: '#344b67', roughness: 0.72 }))
    tip.position.y = 0.941
    this.cueStick.add(shaft, butt, wrap, ferrule, tip)
    this.cueStick.visible = false
    this.cueStick.traverse((object) => { if (object instanceof Mesh) object.castShadow = true })
  }

  private createSurfaceTexture(kind: 'wood' | 'felt'): CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not create a procedural table texture')
    if (kind === 'wood') {
      context.fillStyle = '#8b5a35'; context.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 180; i += 1) {
        const y = Math.random() * 512
        context.strokeStyle = i % 5 === 0 ? 'rgba(42,20,9,0.22)' : 'rgba(226,176,112,0.12)'
        context.lineWidth = 1 + Math.random() * 5
        context.beginPath(); context.moveTo(0, y)
        context.bezierCurveTo(160, y - 14, 340, y + 18, 512, y + (Math.random() - 0.5) * 22); context.stroke()
      }
    } else {
      context.fillStyle = '#176447'; context.fillRect(0, 0, 512, 512)
      for (let y = 0; y < 512; y += 3) { context.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,20,12,0.035)'; context.fillRect(0, y, 512, 1) }
      for (let x = 0; x < 512; x += 3) { context.fillStyle = x % 6 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,20,12,0.025)'; context.fillRect(x, 0, 1, 512) }
    }
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    return texture
  }

  private addPocketJaws(
    railWood: MeshStandardMaterial,
    cushion: MeshStandardMaterial,
    halfLength: number,
    halfWidth: number,
    railY: number,
  ): void {
    const { pocketCaptureRadius, sidePocketHalfWidth, pocketJawDepth, ballRadius } =
      DEFAULT_PHYSICS_CONFIG
    const innerCornerOffset = Math.max(0, pocketCaptureRadius - pocketJawDepth)

    for (const xSign of [-1, 1]) {
      for (const zSign of [-1, 1]) {
        const innerTip = {
          x: xSign * (halfLength - innerCornerOffset),
          z: zSign * (halfWidth - innerCornerOffset),
        }
        const longRailJawStart = {
          x: xSign * (halfLength - pocketCaptureRadius),
          z: zSign * halfWidth,
        }
        const endRailJawStart = {
          x: xSign * halfLength,
          z: zSign * (halfWidth - pocketCaptureRadius),
        }
        this.addAngledJaw(railWood, longRailJawStart, innerTip, railY, 0.13, 0.035)
        this.addAngledJaw(cushion, longRailJawStart, innerTip, railY + 0.035, 0.045, 0.018)
        this.addAngledJaw(railWood, endRailJawStart, innerTip, railY, 0.13, 0.035)
        this.addAngledJaw(cushion, endRailJawStart, innerTip, railY + 0.035, 0.045, 0.018)
      }
    }

    const sideJawInnerX = sidePocketHalfWidth + ballRadius
    for (const zSign of [-1, 1]) {
      for (const xSign of [-1, 1]) {
        const start = {
          x: xSign * sideJawInnerX,
          z: zSign * (halfWidth - pocketJawDepth),
        }
        const end = {
          x: xSign * (sideJawInnerX + pocketJawDepth),
          z: zSign * halfWidth,
        }
        this.addAngledJaw(railWood, start, end, railY, 0.13, 0.035)
        this.addAngledJaw(cushion, start, end, railY + 0.035, 0.045, 0.018)
      }
    }
  }

  private addAngledJaw(
    material: MeshStandardMaterial,
    start: Vec2,
    end: Vec2,
    y: number,
    height: number,
    width: number,
  ): void {
    const dx = end.x - start.x
    const dz = end.z - start.z
    const length = Math.hypot(dx, dz)
    if (length <= 1e-6) return

    const jaw = new Mesh(new BoxGeometry(length, height, width), material)
    jaw.position.set((start.x + end.x) / 2, y, (start.z + end.z) / 2)
    jaw.rotation.y = Math.atan2(-dz, dx)
    jaw.castShadow = true
    jaw.receiveShadow = true
    this.scene.add(jaw)
  }

  private addBox(
    material: MeshStandardMaterial,
    length: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
  ): void {
    const mesh = new Mesh(new BoxGeometry(length, height, depth), material)
    mesh.position.set(x, y, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
  }
}
