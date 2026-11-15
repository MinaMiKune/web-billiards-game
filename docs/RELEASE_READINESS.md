# Release Readiness and Acceptance Gates

This document defines the evidence required before publishing the first stable release. A green CI run or a successful GitHub Pages deployment is necessary, but neither is a substitute for gameplay and device validation.

## Release target

- Product: immediately playable, browser-based American 8-ball.
- Core promise: approachable game flow backed by deterministic, game-realistic physics.
- Supported locales: English, Simplified Chinese, Traditional Chinese and Japanese.
- Supported play: local two-player and five AI difficulty levels.
- Supported cameras: top, angled, side and free observation.
- Online multiplayer is explicitly out of scope for the first release.

## Gate 1 — Automated quality

- [ ] CI passes on the exact release candidate commit: install, typecheck, all tests, production build and performance benchmark.
- [ ] Production build is served from the intended GitHub Pages URL and loads all assets and the AI worker.
- [ ] No known high-severity defects remain in rules, physics, AI, input, localization or persistence.
- [ ] Release candidate commit is immutable after final verification; any change restarts the gate.

Evidence: CI run URL, commit SHA, test summary and deployment URL.

## Gate 2 — Gameplay acceptance

- [ ] A new player can start a match and take a first shot without reading external instructions.
- [ ] Break, open-table assignment, legal/illegal turns, scratches, ball-in-hand, 8-ball win/loss and configured break options behave correctly.
- [ ] Local two-player and all five AI difficulty levels complete full matches.
- [ ] Direct, bank, kick and safety planning do not produce illegal shots or lock the game.
- [ ] Rematch, new rack, camera selection, sound and preference persistence work.
- [ ] Shot history, turn feedback and winner feedback remain correct after fouls and re-racks.

Record reproducible steps and the tested commit for each failure.

## Gate 3 — Visual, audio and tactile acceptance

- [ ] Inspect table/felt/wood materials, cue proportions, ball contact shadows and lighting in all four camera views.
- [ ] Confirm cue strike, ball collision, rail collision and pocket audio are distinct and never interrupt simulation.
- [ ] Confirm mobile vibration works where the browser exposes it, is best-effort, and gracefully no-ops where unavailable.
- [ ] Review texture generation, GPU cost and reduced-motion/accessibility behavior on low-end devices.

## Gate 4 — Browser and responsive acceptance

Run the manual matrix in docs/BROWSER_QA.md on actual browsers/devices. At minimum record:

- Desktop Chrome, Firefox and Safari.
- Android Chrome and iOS Safari.
- 320 px and 375 px narrow viewports, tablet and desktop.
- Browser/OS versions, device, viewport, GPU, date, console errors and pass/fail notes.

Do not infer mobile Safari or touch behavior from desktop emulation. Confirm pointer cancellation, page-scroll suppression, canvas resize, WebGL startup, worker loading and all four camera modes on real devices.

## Gate 5 — Physics evidence

The physics engine is currently a deterministic game-simulation model, not a measured calibration of a physical table.

Before describing it as physically calibrated, require:
- A named reference table and documented playing-surface/cushion/pocket measurements.
- Raw, repeatable reference-shot trajectories with timestamps and uncertainty.
- Fitted parameter configuration and reproducible fitting output.
- Held-out validation for roll, slide, spin, ball collision, cushion rebound and pocket/jaw outcomes.
- Recorded error metrics and accepted tolerances tied to measurement resolution.

If this evidence is not available, release notes and product copy must retain the explicit game-realistic / not physically calibrated qualification.

## Gate 6 — Release operations

- [ ] Choose and document the release version; update package.json, lockfile and user-facing version references together.
- [ ] Review license, dependency changes, attribution, privacy implications of browser storage and known limitations.
- [ ] Verify the production Pages deployment from the exact release tag.
- [ ] Create a Git tag and GitHub Release with concise highlights, supported platforms, known issues and the exact source commit.
- [ ] Verify the release page and public play URL after publication.

## Current known blockers

At the time this checklist was added:
- Actual-device and cross-browser verification is still outstanding.
- No measured physical-table calibration dataset has been supplied.
- The repository has no published GitHub Release yet.

These are real acceptance gaps, not tasks to mark complete from code inspection alone.
