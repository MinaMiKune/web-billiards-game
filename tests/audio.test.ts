import { describe, expect, it } from 'vitest'
import { SoundEffects } from '../src/audio/SoundEffects'

describe('SoundEffects', () => {
  it('keeps gameplay safe when audio is disabled or unavailable', () => {
    const sounds = new SoundEffects()
    sounds.setEnabled(false)
    expect(() => sounds.playCue()).not.toThrow()
    expect(() => sounds.playPocket()).not.toThrow()
    expect(() => sounds.dispose()).not.toThrow()
  })
})
