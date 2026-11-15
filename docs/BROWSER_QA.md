# Browser QA Checklist

This checklist is the manual acceptance plan for real-browser verification. Automated TypeScript, unit, production-build and performance-smoke checks do not replace these device/browser checks.

## Browser matrix

Run on current stable releases where available:

| Browser | Desktop | Mobile |
| --- | --- | --- |
| Chrome / Chromium | Windows or macOS | Android Chrome |
| Firefox | Windows or macOS | — |
| Safari / WebKit | macOS Safari | iOS Safari |

Record browser version, operating system/device, GPU, viewport size and test date with each run.

## Startup and rendering

- [ ] App loads without console errors or failed module/worker requests.
- [ ] WebGL renderer initializes and displays the table, all six pockets and 16 balls.
- [ ] Top, angled, side and free cameras frame the same table and balls.
- [ ] Resize and device-pixel-ratio changes keep the table correctly framed.
- [ ] Web Worker AI requests return a plan; worker failure falls back to synchronous planning.

## Gameplay and rules

- [ ] Pointer/touch drag aims and release shoots without page scrolling.
- [ ] Shot power and cue contact-point spin controls respond.
- [ ] Cue-elevation slider covers 0–25°; the cue model and aim preview track the selected angle, and 0° remains a planar shot.
- [ ] Elevated shots visibly rise, cast a separated contact shadow, transfer vertical motion on ball contact and land without tunneling or persistent jitter.
- [ ] Ball-in-hand placement accepts legal spots and rejects overlaps/pockets/out-of-bounds positions.
- [ ] Call-shot mode validates the selected ball and pocket.
- [ ] AI mode completes turns at all five difficulty levels.
- [ ] Re-rack and breaker-wins 8-ball-on-break options behave as configured.
- [ ] Shot history, active-player state and match winner update correctly.

## Audio, accessibility and localization

- [ ] Cue, ball-ball, rail and pocket sounds are distinct, play after a user gesture, and never stall the simulation; mute suppresses all effects.
- [ ] Mobile haptics respond to cue/ball/rail impacts where supported, do not duplicate for solver iterations, and safely no-op where vibration APIs are unavailable.
- [ ] Browsers without Web Audio continue gameplay silently.
- [ ] prefers-reduced-motion disables orbit damping and reduces CSS motion.
- [ ] Table canvas can receive keyboard focus and shows a visible focus ring.
- [ ] Camera shortcuts do not hijack input/select/button controls.
- [ ] English, Simplified Chinese, Traditional Chinese and Japanese cover static and dynamic game messages.

## Responsive and performance checks

- [ ] Layout remains usable at 320 px, 375 px, 768 px, 1280 px and ultrawide widths.
- [ ] Touch controls do not trigger accidental browser gestures.
- [ ] On Android Chrome and iOS Safari, verify elevation and spin controls are touch-operable while the table canvas prevents unintended page scrolling.
- [ ] No horizontal overflow or clipped rule controls on mobile.
- [ ] High-difficulty AI search does not block rendering because it runs in a worker.
- [ ] Run npm run bench:performance on a fixed machine/runtime and compare with previous runs.

## Sign-off

Do not mark browser QA complete until the matrix and gameplay checks have been run on actual browsers/devices and the results (including failures) have been recorded.
