import { afterEach, describe, expect, it, vi } from 'vitest'
import { TactileFeedback } from '../src/input/TactileFeedback'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('TactileFeedback', () => {
  it('sends distinct patterns for cue, object-ball, rail and pocket events', () => {
    vi.useFakeTimers()
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal('document', { visibilityState: 'visible' })
    const feedback = new TactileFeedback()

    feedback.shot(0.5)
    vi.advanceTimersByTime(40)
    feedback.impact(3, 0.7)
    vi.advanceTimersByTime(40)
    feedback.rail(0.5)
    vi.advanceTimersByTime(40)
    feedback.pocket(1)

    expect(vibrate.mock.calls.map(([pattern]) => pattern)).toEqual([
      8 + Math.round(0.5 * 18),
      [8, 10, Math.round(8 + 0.7 * 12)],
      Math.round(6 + 0.5 * 12),
      [18, 12, 24],
    ])
  })

  it('throttles repeated contact feedback across adjacent frames', () => {
    vi.useFakeTimers()
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal('document', { visibilityState: 'visible' })
    const feedback = new TactileFeedback()

    feedback.impact(1)
    vi.advanceTimersByTime(16)
    feedback.impact(1)
    vi.advanceTimersByTime(36)
    feedback.impact(1)

    expect(vibrate).toHaveBeenCalledTimes(2)
  })

  it('stops active vibration when disabled or disposed', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal('document', { visibilityState: 'visible' })
    const feedback = new TactileFeedback()

    feedback.shot(1)
    feedback.setEnabled(false)
    feedback.dispose()

    expect(vibrate.mock.calls).toEqual([[26], [0], [0]])
  })

  it('does not vibrate while the page is hidden', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal('document', { visibilityState: 'hidden' })
    new TactileFeedback().pocket()
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('safely no-ops when vibration is unavailable', () => {
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('document', { visibilityState: 'visible' })
    const feedback = new TactileFeedback()
    expect(() => feedback.shot(1)).not.toThrow()
    expect(() => feedback.dispose()).not.toThrow()
  })
})
