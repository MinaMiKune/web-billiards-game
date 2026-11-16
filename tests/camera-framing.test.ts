import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('pool table camera framing', () => {
  it('keeps perspective views close enough to inspect pocket and rail geometry', () => {
    const cameraSource = readFileSync(
      new URL('../src/camera/CameraManager.ts', import.meta.url),
      'utf8',
    )
    expect(cameraSource).toContain('new PerspectiveCamera(34, 1, 0.05, 40)')
    expect(cameraSource).toContain('position.set(2.0, 2.6, 2.6)')
    expect(cameraSource).toContain("if (mode === 'angled') {")
    expect(cameraSource).toContain('position.set(0, 0.75, 3.1)')
  })
})
