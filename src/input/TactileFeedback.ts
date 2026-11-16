/** Optional mobile-device haptics. Vibration is best-effort and never blocks gameplay. */
export class TactileFeedback {
  private enabled = true
  private readonly supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  private lastPulseAt = Number.NEGATIVE_INFINITY
  private static readonly MIN_PULSE_INTERVAL_MS = 36

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.stopVibration()
  }

  shot(power: number): void {
    this.pulse(8 + Math.round(Math.max(0, Math.min(1, power)) * 18))
  }

  impact(ballNumber: number, intensity = 0.6): void {
    // A short double-tap distinguishes object-ball contact from the cue strike.
    const strength = Math.max(0.3, Math.min(1, intensity))
    this.pulse(ballNumber === 8 ? [12, 18, Math.round(12 + strength * 12)] : [8, 10, Math.round(8 + strength * 12)])
  }

  rail(intensity = 0.5): void {
    this.pulse(Math.round(6 + Math.max(0, Math.min(1, intensity)) * 12))
  }

  pocket(count = 1): void {
    this.pulse(count > 1 ? [12, 24, 18] : [18, 12, 24])
  }

  dispose(): void {
    this.stopVibration()
  }

  private stopVibration(): void {
    if (!this.supported) return
    try { navigator.vibrate(0) } catch { /* Device feedback is optional. */ }
  }

  private pulse(pattern: number | number[]): void {
    if (!this.enabled || !this.supported) return
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return

    // Contact events can arrive on consecutive render frames. Throttle the
    // physical vibration channel so sustained contacts do not become a buzz.
    const now = Date.now()
    if (now - this.lastPulseAt < TactileFeedback.MIN_PULSE_INTERVAL_MS) return
    this.lastPulseAt = now
    try { navigator.vibrate(pattern) } catch { /* iOS and some browsers do not expose vibration. */ }
  }
}
