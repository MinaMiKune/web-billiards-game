import {
  OrthographicCamera,
  PerspectiveCamera,
  Vector3,
  type Camera,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { DEFAULT_PHYSICS_CONFIG } from '../physics/PhysicsWorld'

export type CameraMode = 'top' | 'angled' | 'side' | 'free'

/**
 * Margin around the table in top view: rails + apron plus breathing room, in
 * world units. Without this the top camera cropped the rails off the frame.
 */
const TOP_VIEW_MARGIN = 0.45

export class CameraManager {
  private readonly topCamera = new OrthographicCamera(-1.7, 1.7, 1, -1, 0.1, 30)
  private readonly perspectiveCamera = new PerspectiveCamera(34, 1, 0.05, 40)
  private readonly orbitControls: OrbitControls
  private activeMode: CameraMode = 'top'
  private readonly target = new Vector3(0, 0, 0)
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')

  constructor(canvas: HTMLCanvasElement) {
    this.topCamera.up.set(0, 0, -1)
    this.topCamera.position.set(0, 4.2, 0)
    this.topCamera.lookAt(this.target)

    this.perspectiveCamera.position.set(2.0, 2.6, 2.6)
    this.perspectiveCamera.lookAt(this.target)

    this.orbitControls = new OrbitControls(this.perspectiveCamera, canvas)
    this.orbitControls.target.copy(this.target)
    this.orbitControls.enableDamping = !this.motionPreference.matches
    this.orbitControls.dampingFactor = 0.08
    this.motionPreference.addEventListener('change', this.onMotionPreferenceChange)
    this.orbitControls.minDistance = 1.6
    this.orbitControls.maxDistance = 8
    this.orbitControls.maxPolarAngle = Math.PI * 0.48
    this.orbitControls.enabled = false
  }

  private onMotionPreferenceChange = (event: MediaQueryListEvent): void => {
    this.orbitControls.enableDamping = !event.matches
    if (event.matches) this.orbitControls.update()
  }

  get mode(): CameraMode {
    return this.activeMode
  }

  get camera(): Camera {
    return this.activeMode === 'top' ? this.topCamera : this.perspectiveCamera
  }

  setMode(mode: CameraMode): void {
    this.activeMode = mode
    this.orbitControls.enabled = mode === 'free'

    if (mode === 'top') {
      this.target.set(0, 0, 0)
      this.topCamera.position.set(0, 4.2, 0)
      this.topCamera.lookAt(this.target)
      return
    }

    if (mode === 'angled') {
      this.target.set(0, -0.22, 0)
      this.perspectiveCamera.position.set(2.0, 2.6, 2.6)
    } else if (mode === 'side') {
      this.target.set(0, -0.28, 0)
      this.perspectiveCamera.position.set(0, 0.75, 3.1)
    } else {
      this.target.set(0, 0, 0)
      this.perspectiveCamera.position.set(2.0, 2.5, 2.6)
    }

    this.orbitControls.target.copy(this.target)
    this.perspectiveCamera.lookAt(this.target)
    this.orbitControls.update()
  }

  resize(width: number, height: number): void {
    const aspect = Math.max(0.1, width / Math.max(height, 1))
    // Fit the whole table: half extents come from the physics table
    // configuration so the frame can never crop the table as it resizes.
    const halfLength = DEFAULT_PHYSICS_CONFIG.tableLength / 2 + TOP_VIEW_MARGIN
    const halfWidth = DEFAULT_PHYSICS_CONFIG.tableWidth / 2 + TOP_VIEW_MARGIN
    // `Math.max` is enough: when aspect ≥ halfLength/halfWidth the height
    // term dominates and the width term fits automatically.
    const viewHeight = Math.max(2 * halfWidth, (2 * halfLength) / aspect)

    this.topCamera.left = (-viewHeight * aspect) / 2
    this.topCamera.right = (viewHeight * aspect) / 2
    this.topCamera.top = viewHeight / 2
    this.topCamera.bottom = -viewHeight / 2
    this.topCamera.updateProjectionMatrix()

    this.perspectiveCamera.aspect = aspect
    this.perspectiveCamera.updateProjectionMatrix()
  }

  update(): void {
    if (this.activeMode === 'free') this.orbitControls.update()
  }

  dispose(): void {
    this.motionPreference.removeEventListener('change', this.onMotionPreferenceChange)
    this.orbitControls.dispose()
  }
}
