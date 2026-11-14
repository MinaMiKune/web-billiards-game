import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { CameraManager, type CameraMode } from '../camera/CameraManager'
import { PhysicsWorld, type BallSpin, type RenderBall } from '../physics/PhysicsWorld'
import { GameRenderer } from '../rendering/GameRenderer'
import { AIController, type AIDifficulty } from '../ai/AIController'
import { createInitialEightBallState, EightBallRuleEngine, type EightBallState } from '../game/EightBallRuleEngine'

const FIXED_STEP = 1 / 120
const MAX_FRAME_DELTA = 0.1
const MAX_SUBSTEPS = 12

function requireElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector)
  if (!element) throw new Error('Required UI element not found: ' + selector)
  return element
}

export class GameApp {
  private readonly world = new PhysicsWorld()
  private readonly rules = new EightBallRuleEngine()
  private readonly ai = new AIController()
  private ruleState: EightBallState = createInitialEightBallState()
  private opponentMode: 'local' | 'ai' = 'local'
  private aiDifficulty: AIDifficulty = 3
  private aiTimer = 0
  private readonly renderer: GameRenderer
  private readonly cameras: CameraManager
  private readonly statusElement: HTMLElement
  private readonly turnElement: HTMLElement
  private readonly interactionHint: HTMLElement
  private readonly powerInput: HTMLInputElement
  private readonly powerValue: HTMLElement
  private readonly spinPad: HTMLElement
  private readonly spinMarker: HTMLElement
  private readonly spinValue: HTMLElement
  private readonly opponentModeInput: HTMLSelectElement
  private readonly aiDifficultyInput: HTMLSelectElement
  private readonly raycaster = new Raycaster()
  private readonly groundPlane = new Plane(new Vector3(0, 1, 0), 0)
  private readonly intersection = new Vector3()
  private readonly pointerNdc = new Vector2()
  private readonly resizeObserver: ResizeObserver
  private aiming = false
  private aimPoint: { x: number; z: number } | null = null
  private spin: BallSpin = { side: 0, vertical: 0 }
  private spinDragging = false
  private power = 0.65
  private accumulator = 0
  private previousTime = 0
  private wasMoving = false
  private frameHandle = 0

  constructor(root: HTMLElement) {
    const sceneHost = requireElement<HTMLDivElement>(root, '#scene-host')
    this.statusElement = requireElement(root, '#game-status')
    this.turnElement = requireElement(root, '#turn-status')
    this.interactionHint = requireElement(root, '#interaction-hint')
    this.powerInput = requireElement<HTMLInputElement>(root, '#shot-power')
    this.powerValue = requireElement(root, '#power-value')
    this.spinPad = requireElement(root, '#spin-pad')
    this.spinMarker = requireElement(root, '#spin-marker')
    this.spinValue = requireElement(root, '#spin-value')
    this.opponentModeInput = requireElement(root, '#opponent-mode')
    this.aiDifficultyInput = requireElement(root, '#ai-difficulty')

    this.renderer = new GameRenderer(sceneHost)
    this.cameras = new CameraManager(this.renderer.canvas)
    this.cameras.setMode('top')
    this.renderer.updateBalls(this.world.getRenderBalls(1))

    this.bindControls(root)
    this.updateTurnStatus()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(sceneHost)
    this.resize()
    this.frameHandle = requestAnimationFrame(this.frame)
  }

  dispose(): void {
    cancelAnimationFrame(this.frameHandle)
    window.clearTimeout(this.aiTimer)
    this.resizeObserver.disconnect()
    this.cameras.dispose()
    this.renderer.dispose()
  }

  private bindControls(root: HTMLElement): void {
    const canvas = this.renderer.canvas
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerCancel)

    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-camera]')) {
      button.addEventListener('click', () => {
        this.setCamera(button.dataset.camera as CameraMode)
      })
    }

    requireElement<HTMLButtonElement>(root, '#reset-rack').addEventListener('click', () => {
      window.clearTimeout(this.aiTimer)
      this.world.resetRack()
      this.ruleState = createInitialEightBallState()
      this.renderer.updateBalls(this.world.getRenderBalls(1))
      this.resetSpin()
      this.setAimVisible(false)
      this.statusElement.textContent = this.ruleState.lastMessage
      this.updateTurnStatus()
    })

    this.opponentModeInput.addEventListener('change', () => {
      this.opponentMode = this.opponentModeInput.value === 'ai' ? 'ai' : 'local'
      this.aiDifficultyInput.disabled = this.opponentMode !== 'ai'
      this.updateTurnStatus()
      this.scheduleAiTurn()
    })

    this.aiDifficultyInput.addEventListener('change', () => {
      const level = Number(this.aiDifficultyInput.value)
      if (level >= 1 && level <= 5) this.aiDifficulty = level as AIDifficulty
    })
    this.aiDifficultyInput.disabled = true

    this.powerInput.addEventListener('input', () => {
      this.power = Number(this.powerInput.value) / 100
      this.powerValue.textContent = this.powerInput.value + '%'
    })

    this.spinPad.addEventListener('pointerdown', this.onSpinPointerDown)
    this.spinPad.addEventListener('pointermove', this.onSpinPointerMove)
    this.spinPad.addEventListener('pointerup', this.onSpinPointerUp)
    this.spinPad.addEventListener('pointercancel', this.onSpinPointerUp)
    this.spinPad.addEventListener('keydown', this.onSpinKeyDown)
    window.addEventListener('keydown', this.onKeyDown)
  }

  private setCamera(mode: CameraMode): void {
    if (!['top', 'angled', 'side', 'free'].includes(mode)) return
    this.cameras.setMode(mode)
    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-camera]')) {
      const active = button.dataset.camera === mode
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement) return
    const modes: Record<string, CameraMode> = {
      '1': 'top',
      '2': 'angled',
      '3': 'side',
      '4': 'free',
    }
    const mode = modes[event.key]
    if (mode) this.setCamera(mode)
  }

  private onSpinPointerDown = (event: PointerEvent): void => {
    this.spinDragging = true
    this.spinPad.setPointerCapture(event.pointerId)
    this.updateSpinFromPointer(event)
  }

  private onSpinPointerMove = (event: PointerEvent): void => {
    if (this.spinDragging) this.updateSpinFromPointer(event)
  }

  private onSpinPointerUp = (event: PointerEvent): void => {
    this.spinDragging = false
    if (this.spinPad.hasPointerCapture(event.pointerId)) {
      this.spinPad.releasePointerCapture(event.pointerId)
    }
  }

  private onSpinKeyDown = (event: KeyboardEvent): void => {
    const amount = 0.1
    let { side, vertical } = this.spin
    if (event.key === 'ArrowLeft') side -= amount
    else if (event.key === 'ArrowRight') side += amount
    else if (event.key === 'ArrowUp') vertical += amount
    else if (event.key === 'ArrowDown') vertical -= amount
    else if (event.key === 'Home') {
      this.resetSpin()
      event.preventDefault()
      return
    } else return

    event.preventDefault()
    this.setSpin(side, vertical)
  }

  private updateSpinFromPointer(event: PointerEvent): void {
    const rect = this.spinPad.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = 1 - ((event.clientY - rect.top) / rect.height) * 2
    this.setSpin(x, y)
  }

  private setSpin(side: number, vertical: number): void {
    const length = Math.hypot(side, vertical)
    const scale = length > 1 ? 1 / length : 1
    this.spin = {
      side: side * scale,
      vertical: vertical * scale,
    }
    this.spinMarker.style.left = ((this.spin.side + 1) / 2 * 100) + '%'
    this.spinMarker.style.top = ((1 - this.spin.vertical) / 2 * 100) + '%'

    const labels: string[] = []
    if (this.spin.vertical > 0.22) labels.push('Follow')
    else if (this.spin.vertical < -0.22) labels.push('Draw')
    if (this.spin.side > 0.22) labels.push('Right')
    else if (this.spin.side < -0.22) labels.push('Left')
    this.spinValue.textContent = labels.length ? labels.join(' · ') : 'Center'
  }

  private resetSpin(): void {
    this.setSpin(0, 0)
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.world.isMoving || this.isAiTurn()) return
    const point = this.pickTablePoint(event)
    if (!point) return

    if (this.ruleState.ballInHand) {
      if (this.world.placeCueBall(point)) {
        this.ruleState = this.rules.placeBallInHand(this.ruleState)
        this.statusElement.textContent = this.ruleState.lastMessage
        this.updateTurnStatus()
        this.renderer.updateBalls(this.world.getRenderBalls(1))
        this.scheduleAiTurn()
      } else {
        this.statusElement.textContent = 'Choose a clear spot away from balls and pockets'
      }
      return
    }

    if (this.ruleState.phase === 'game-over' || !this.world.cueBall.active) return

    const cue = this.world.cueBall.position
    if (Math.hypot(point.x - cue.x, point.z - cue.z) > 0.16) return

    event.preventDefault()
    this.aiming = true
    this.aimPoint = point
    this.renderer.canvas.setPointerCapture(event.pointerId)
    this.updateAimPreview()
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.aiming) return
    this.aimPoint = this.pickTablePoint(event)
    this.updateAimPreview()
  }

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.aiming) return
    this.aimPoint = this.pickTablePoint(event) ?? this.aimPoint
    const cue = this.world.cueBall.position
    if (this.aimPoint) {
      const dx = cue.x - this.aimPoint.x
      const dz = cue.z - this.aimPoint.z
      const length = Math.hypot(dx, dz)
      if (length > 0.045 && this.world.shootCueBall(
        { x: dx / length, z: dz / length },
        this.power,
        this.spin,
      )) {
        this.statusElement.textContent = 'Balls in motion'
        this.wasMoving = true
      }
    }
    this.aiming = false
    this.aimPoint = null
    this.setAimVisible(false)
    if (this.renderer.canvas.hasPointerCapture(event.pointerId)) {
      this.renderer.canvas.releasePointerCapture(event.pointerId)
    }
  }

  private onPointerCancel = (): void => {
    this.aiming = false
    this.aimPoint = null
    this.setAimVisible(false)
  }

  private pickTablePoint(event: PointerEvent): { x: number; z: number } | null {
    const rect = this.renderer.canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    )
    this.raycaster.setFromCamera(this.pointerNdc, this.cameras.camera)
    const point = this.raycaster.ray.intersectPlane(this.groundPlane, this.intersection)
    return point ? { x: point.x, z: point.z } : null
  }

  private cueRenderBall(): RenderBall {
    const cue = this.world.cueBall
    return {
      id: cue.id,
      number: cue.number,
      color: cue.color,
      radius: cue.radius,
      position: cue.position,
      rotation: cue.rotation,
      active: cue.active,
      pocketed: cue.pocketed,
      pocketProgress: 0,
      pocketTarget: cue.pocketTarget,
    }
  }

  private updateAimPreview(): void {
    const cue = this.world.cueBall
    if (!this.aiming || !this.aimPoint || !cue.active) {
      this.setAimVisible(false)
      return
    }

    const dx = cue.position.x - this.aimPoint.x
    const dz = cue.position.z - this.aimPoint.z
    const length = Math.hypot(dx, dz)
    if (length < 1e-5) {
      this.setAimVisible(false)
      return
    }

    this.renderer.setAimPreview(
      this.cueRenderBall(),
      { x: dx / length, z: dz / length },
      Math.min(length, 0.8),
      true,
    )
  }

  private setAimVisible(visible: boolean): void {
    this.renderer.setAimPreview(this.cueRenderBall(), { x: 1, z: 0 }, 0, visible)
  }

  private updateTurnStatus(): void {
    const currentGroup = this.ruleState.playerGroups[this.ruleState.currentPlayer]
    const phaseLabel = this.ruleState.phase === 'break'
      ? 'Break'
      : this.ruleState.phase === 'open-table'
        ? 'Open table'
        : this.ruleState.phase === 'game-over'
          ? 'Game over'
          : 'Groups assigned'
    const groupLabel = currentGroup ? ` · ${currentGroup}` : ''
    const ballInHandLabel = this.ruleState.ballInHand ? ' · BALL IN HAND — CLICK TO PLACE' : ''
    const winnerLabel = this.ruleState.winner === null ? '' : ` · WINNER: PLAYER ${this.ruleState.winner + 1}`
    const playerLabel = this.opponentMode === 'ai' && this.ruleState.currentPlayer === 1
      ? 'AI OPPONENT'
      : `PLAYER ${this.ruleState.currentPlayer + 1}`
    const modeLabel = this.opponentMode === 'ai' ? ' · VS AI' : ' · LOCAL 2P'
    this.turnElement.textContent =
      `${playerLabel}${groupLabel} · ${phaseLabel.toUpperCase()}${ballInHandLabel}${winnerLabel}${modeLabel}`

    this.interactionHint.textContent = this.ruleState.ballInHand
      ? 'CLICK A CLEAR SPOT ON THE TABLE TO PLACE THE CUE BALL'
      : this.ruleState.phase === 'game-over'
        ? 'GAME OVER · START A NEW RACK TO PLAY AGAIN'
        : this.isAiTurn()
          ? 'AI OPPONENT IS ANALYZING THE TABLE'
          : 'DRAG BACK FROM THE CUE BALL TO AIM · RELEASE TO SHOOT'
  }

  private isAiTurn(): boolean {
    return this.opponentMode === 'ai' &&
      this.ruleState.currentPlayer === 1 &&
      this.ruleState.phase !== 'game-over'
  }

  private scheduleAiTurn(): void {
    window.clearTimeout(this.aiTimer)
    if (!this.isAiTurn() || this.world.isMoving) return

    this.aiTimer = window.setTimeout(() => {
      this.runAiTurn()
    }, 420)
  }

  private runAiTurn(): void {
    if (!this.isAiTurn() || this.world.isMoving) return

    if (this.ruleState.ballInHand) {
      const position = this.ai.chooseBallInHandPlacement(this.world, this.ruleState)
      if (!position || !this.world.placeCueBall(position)) {
        this.statusElement.textContent = 'AI could not find a legal cue-ball position'
        return
      }
      this.ruleState = this.rules.placeBallInHand(this.ruleState)
      this.renderer.updateBalls(this.world.getRenderBalls(1))
      this.updateTurnStatus()
    }

    const plan = this.ai.planShot(this.world, this.ruleState, this.aiDifficulty)
    if (!plan) {
      this.statusElement.textContent = 'AI could not find a legal target'
      return
    }

    if (!this.world.shootCueBall(
      plan.command.direction,
      plan.command.power,
      plan.command.spin,
    )) {
      this.statusElement.textContent = 'AI shot was rejected by the physics world'
      return
    }

    this.statusElement.textContent =
      `AI · ${plan.style === 'pot' ? 'pot attempt' : 'safety attempt'} · target ${plan.targetBallNumber}`
    this.wasMoving = true
  }

  private resize(): void {
    const canvas = this.renderer.canvas
    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return
    this.renderer.resize(rect.width, rect.height)
    this.cameras.resize(rect.width, rect.height)
  }

  private frame = (time: number): void => {
    if (this.previousTime === 0) this.previousTime = time
    const frameDelta = Math.min((time - this.previousTime) / 1000, MAX_FRAME_DELTA)
    this.previousTime = time
    this.accumulator += frameDelta

    let steps = 0
    while (this.accumulator >= FIXED_STEP && steps < MAX_SUBSTEPS) {
      this.world.step(FIXED_STEP)
      this.accumulator -= FIXED_STEP
      steps += 1
    }
    if (steps === MAX_SUBSTEPS) this.accumulator = 0

    const moving = this.world.isMoving
    if (this.wasMoving && !moving) {
      this.wasMoving = false
      const resolution = this.rules.resolveShot(this.ruleState, this.world.getShotTelemetry())
      this.ruleState = resolution.state
      if (resolution.rerack) {
        this.world.resetRack()
        this.resetSpin()
      }
      this.statusElement.textContent = resolution.state.lastMessage
      this.updateTurnStatus()
      this.scheduleAiTurn()
    }

    this.cameras.update()
    this.renderer.updateBalls(this.world.getRenderBalls(this.accumulator / FIXED_STEP))
    this.renderer.render(this.cameras.camera)
    this.frameHandle = requestAnimationFrame(this.frame)
  }
}
