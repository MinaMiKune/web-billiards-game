# Public Beta 0.3.0-beta.1

## What this preview includes

- Browser-based American 8-ball with local two-player and five AI difficulty levels.
- Four camera views, touch/mouse aiming, power, spin and cue elevation controls.
- Reworked 3D table presentation, ball materials, cue model, contact shadows and procedural sound/haptics.
- English, Simplified Chinese, Traditional Chinese and Japanese.

## Known limitations

- This is a beta preview. Rules, AI decisions, visual presentation and mobile controls still need broader player testing.
- Mobile vibration depends on browser/device support; iOS Safari may not expose the Vibration API.
- Desktop and mobile real-device QA has not yet been signed off across the full browser matrix.
- Physics is deterministic and game-realistic, but it is not calibrated against measured trajectories from a named physical table.
- Online multiplayer is not included.

## Feedback to include

When reporting an issue, include the browser and version, operating system/device, viewport size, selected language/camera/AI difficulty, exact steps to reproduce, expected result, actual result and (if possible) a screenshot or short recording. For physics issues, include the shot setup, cue direction/power/spin/elevation and observed ball outcome.

## Build identity

The beta tag must point to the exact `main` commit that passed typecheck, all tests, production build and performance benchmark. The public Pages deployment and GitHub prerelease are published only after those checks pass.
