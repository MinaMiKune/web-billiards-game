import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  SRGBColorSpace,
} from 'three'
import type { Camera } from 'three'
import type { RenderBall } from '../physics/PhysicsWorld'

const TABLE_LENGTH = 2.54
const TABLE_WIDTH = 1.27

export class GameRenderer {
  readonly renderer: WebGLRenderer
  readonly scene = new Scene()
  private readonly ballMeshes = new Map<string, Mesh<SphereGeometry, MeshStandardMaterial>>()
  private readonly aimLine: Line
  private readonly cueLine: Line

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
    this.scene.add(this.aimLine, this.cueLine)
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
        const material = new MeshStandardMaterial({
          color: ball.color,
          roughness: 0.24,
          metalness: 0.02,
        })
        mesh = new Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.ballMeshes.set(ball.id, mesh)
        this.scene.add(mesh)
      }

      mesh.visible = ball.active
      mesh.position.set(ball.position.x, ball.radius, ball.position.z)
    }
  }

  setAimPreview(cue: RenderBall, direction: { x: number; z: number }, pull: number, visible: boolean): void {
    this.aimLine.visible = visible
    this.cueLine.visible = visible
    if (!visible) return

    const dx = direction.x
    const dz = direction.z
    const start = new Vector3(cue.position.x + dx * 0.04, cue.radius + 0.006, cue.position.z + dz * 0.04)
    const end = new Vector3(cue.position.x + dx * 1.1, cue.radius + 0.006, cue.position.z + dz * 1.1)
    const cueStart = new Vector3(cue.position.x - dx * 0.11, cue.radius + 0.02, cue.position.z - dz * 0.11)
    const cueEnd = new Vector3(
      cue.position.x - dx * (0.32 + pull * 0.55),
      cue.radius + 0.02,
      cue.position.z - dz * (0.32 + pull * 0.55),
    )

    this.aimLine.geometry.dispose()
    this.cueLine.geometry.dispose()
    this.aimLine.geometry = new BufferGeometry().setFromPoints([start, end])
    this.cueLine.geometry = new BufferGeometry().setFromPoints([cueStart, cueEnd])
  }

  render(camera: Camera): void {
    this.renderer.render(this.scene, camera)
  }

  dispose(): void {
    this.renderer.dispose()
    this.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose()
        const material = object.material
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else material.dispose()
      }
    })
  }

  private addLighting(): void {
    this.scene.add(new AmbientLight('#c5d4c8', 1.35))
    const key = new DirectionalLight('#fff0d0', 2.6)
    key.position.set(-2.8, 5.4, 3.2)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3.5
    key.shadow.camera.right = 3.5
    key.shadow.camera.top = 3
    key.shadow.camera.bottom = -3
    this.scene.add(key)

    const fill = new DirectionalLight('#7fae9a', 0.7)
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
    const wood = new MeshStandardMaterial({ color: '#5b3822', roughness: 0.32 })
    const railWood = new MeshStandardMaterial({ color: '#70472a', roughness: 0.3 })
    const cushion = new MeshStandardMaterial({ color: '#174b3a', roughness: 0.88 })
    const felt = new MeshStandardMaterial({ color: '#176447', roughness: 0.96 })
    const pocket = new MeshStandardMaterial({ color: '#080c0b', roughness: 1 })
    const pocketRim = new MeshStandardMaterial({ color: '#bd9b60', roughness: 0.45, metalness: 0.3 })

    const body = new Mesh(new BoxGeometry(TABLE_LENGTH + 0.42, 0.2, TABLE_WIDTH + 0.42), wood)
    body.position.y = -0.12
    body.castShadow = true
    body.receiveShadow = true
    this.scene.add(body)

    const feltMesh = new Mesh(new PlaneGeometry(TABLE_LENGTH, TABLE_WIDTH), felt)
    feltMesh.rotation.x = -Math.PI / 2
    feltMesh.position.y = -0.015
    feltMesh.receiveShadow = true
    this.scene.add(feltMesh)

    const halfL = TABLE_LENGTH / 2
    const halfW = TABLE_WIDTH / 2
    const railHeight = 0.13
    const railDepth = 0.14
    const railY = 0.045
    const longSegmentLength = halfL - 0.16

    for (const side of [-1, 1]) {
      for (const segmentCenter of [-(halfL - longSegmentLength / 2 - 0.08), halfL - longSegmentLength / 2 - 0.08]) {
        this.addBox(railWood, longSegmentLength, railHeight, railDepth, segmentCenter, railY, side * (halfW + 0.065))
        this.addBox(cushion, longSegmentLength, 0.045, 0.035, segmentCenter, railY + 0.035, side * (halfW + 0.005))
      }

      this.addBox(railWood, railDepth, railHeight, TABLE_WIDTH - 0.24, side * (halfL + 0.065), railY, 0)
      this.addBox(cushion, 0.035, 0.045, TABLE_WIDTH - 0.24, side * (halfL + 0.005), railY + 0.035, 0)
    }

    const pocketPositions = [
      [-halfL, -halfW], [0, -halfW], [halfL, -halfW],
      [-halfL, halfW], [0, halfW], [halfL, halfW],
    ]

    for (const [x, z] of pocketPositions) {
      const rim = new Mesh(new CircleGeometry(0.083, 32), pocketRim)
      rim.rotation.x = -Math.PI / 2
      rim.position.set(x, -0.004, z)
      this.scene.add(rim)

      const hole = new Mesh(new CircleGeometry(0.068, 32), pocket)
      hole.rotation.x = -Math.PI / 2
      hole.position.set(x, 0.001, z)
      this.scene.add(hole)

      const drop = new Mesh(new CylinderGeometry(0.067, 0.045, 0.065, 32), pocket)
      drop.position.set(x, -0.052, z)
      this.scene.add(drop)
    }

    const outerTrim = new Mesh(new BoxGeometry(TABLE_LENGTH + 0.46, 0.035, TABLE_WIDTH + 0.46), railWood)
    outerTrim.position.y = -0.225
    this.scene.add(outerTrim)
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
