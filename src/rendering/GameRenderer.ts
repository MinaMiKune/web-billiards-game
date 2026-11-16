import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  Color,
  DirectionalLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
  PCFSoftShadowMap,
  Scene,
  SphereGeometry,
  SpotLight,
  Vector3,
  WebGLRenderer,
  SRGBColorSpace,
} from 'three'
import type { Camera } from 'three'
import type { Material } from 'three'
import { createPoolTableModel } from './PoolTableModel'
import type { RenderBall, Vec2 } from '../physics/PhysicsWorld'

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
    // Keep contact and furniture shadows, but use soft filtered maps rather
    // than the hard, nearly-black silhouettes from the previous renderer.
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
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
    this.scene.add(new AmbientLight('#d9e8dc', 1.15))

    const key = new DirectionalLight('#fff3dc', 1.8)
    key.position.set(-2.8, 5.4, 3.2)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.radius = 5
    key.shadow.bias = -0.00012
    key.shadow.normalBias = 0.018
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 10
    key.shadow.camera.left = -3.5
    key.shadow.camera.right = 3.5
    key.shadow.camera.top = 3
    key.shadow.camera.bottom = -3
    this.scene.add(key)

    // Soft overhead pool-hall light keeps the cloth and numbered balls readable
    // across the top, angled and side cameras without changing physics state.
    const overhead = new SpotLight('#fff0d4', 1.25, 10, 0.58, 0.62, 1.5)
    overhead.position.set(0, 5.4, 0)
    overhead.target.position.set(0, 0, 0)
    overhead.castShadow = false
    overhead.shadow.mapSize.set(1024, 1024)
    overhead.shadow.camera.near = 0.5
    overhead.shadow.camera.far = 9
    overhead.shadow.bias = -0.00015
    this.scene.add(overhead, overhead.target)

    const fill = new DirectionalLight('#9ed5b2', 0.65)
    fill.position.set(3.5, 2.5, -3)
    this.scene.add(fill)
  }

  private addEnvironment(): void {
    const floor = new Mesh(
      new PlaneGeometry(30, 30),
      new MeshStandardMaterial({ color: '#101b17', roughness: 0.95 }),
    )
    floor.rotation.x = -Math.PI / 2
    // Keep the environment floor below the table feet; the old -0.27 plane hid
    // almost the entire legs and made the table look like a floating slab.
    floor.position.y = -1.05
    floor.receiveShadow = true
    this.scene.add(floor)
  }

  private addTable(): void {
    const table = createPoolTableModel(this.renderer.capabilities.getMaxAnisotropy())
    this.scene.add(table)
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


}
