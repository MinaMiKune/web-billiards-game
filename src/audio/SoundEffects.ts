export class SoundEffects {
  private context: AudioContext | null = null
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  playCue(): void {
    this.playTone(155, 92, 0.075, 'triangle', 0.035)
  }

  playPocket(): void {
    this.playTone(235, 58, 0.17, 'sine', 0.055)
  }

  dispose(): void {
    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => undefined)
    }
    this.context = null
  }

  private playTone(
    startFrequency: number,
    endFrequency: number,
    duration: number,
    waveform: OscillatorType,
    volume: number,
  ): void {
    if (!this.enabled || typeof window === 'undefined') return
    const context = this.getContext()
    if (!context) return

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime
    const end = start + duration

    oscillator.type = waveform
    oscillator.frequency.setValueAtTime(startFrequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, end)
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(end)
  }

  private getContext(): AudioContext | null {
    const AudioContextConstructor = window.AudioContext
    if (typeof AudioContextConstructor !== 'function') return null

    if (!this.context) this.context = new AudioContextConstructor()
    if (this.context.state === 'suspended') {
      void this.context.resume().catch(() => undefined)
    }
    return this.context
  }
}
