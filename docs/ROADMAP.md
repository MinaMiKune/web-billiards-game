# Development Roadmap

Selected decisions:
- Simulation target: game-realistic.
- Cameras: top, angled, side and free-observation.
- Physics priority: high.
- Online multiplayer: reserved, not currently developed.

## Phase 0 — Engineering foundation

- [x] Establish architecture and module boundaries.
- [x] Document development, physics and roadmap conventions.
- [x] Add a test runner and CI test gate.
- [x] Remove lockfile-dependent npm cache until a lockfile is committed.
- [x] Generate and commit package-lock.json; use npm ci and restore npm caching.
- [x] Enable GitHub Pages and verify a successful deployment on main.

## Phase 1 — 3D playable prototype

- [x] Create a Three.js scene and 3D pool table.
- [x] Add six pocket visuals and ball models.
- [x] Add top, angled, side and free camera modes.
- [x] Implement a fixed-step physics world independent of Three.js.
- [x] Add first-pass rolling deceleration, ball collision and straight cushion response.
- [x] Add basic aim/power interaction and cue-line preview.
- [x] Add circular corner-pocket and side-pocket capture regions with cushion near-miss tests.

## Phase 2 — Table behavior and controls

- [x] Implement sliding-to-rolling contact friction.
- [x] Add basic follow/draw and side-spin state.
- [x] Add a 2D cue-ball contact selector.
- [x] Rotate numbered/striped ball textures with the simulated angular velocity.
- [x] Establish deterministic software baselines for rolling deceleration, sliding impulse, side-spin decay and collision momentum.
- [x] Add repeatable fixed-step shot scenarios for straight hits, cut shots, follow and side-spin cushion approaches.
- [ ] Calibrate friction and spin parameters against measured reference shots.
- [x] Add tangential ball-ball collision impulses and spin-dependent cushion rebound.
- [x] Add presentation-only ball drop animation after pocket capture.
- [x] Add first-pass angled jaw collisions for corner and side pockets with capture/near-miss regression tests.
- [ ] Calibrate pocket opening width, jaw depth and trajectories against a measured table.

## Phase 3 — Rules and game flow

- [x] Add a standard 8-ball rack arrangement with the 8 centered and opposite groups at the rear corners.
- [x] Add a pure, deterministic American 8-ball rules engine.
- [x] Track first cue-ball contact, pocket events and rail contact in the physics layer.
- [x] Add regression tests for first-contact ordering, post-hit rail contact, cue-ball scratches and defensive telemetry snapshots.
- [x] Support break/open-table/group assignment, turn switching, fouls and 8-ball win/loss.
- [x] Add ball-in-hand placement with collision and pocket-area validation.
- [x] Add optional called-ball/called-pocket rules for human and AI shots.
- [ ] Add the remaining tournament ruleset variants (break and foul variations).
- [x] Add game-flow UI for shot history, player groups and match result summary.

## Phase 4 — AI opponents

- [x] Add a physics-world clone for isolated deterministic shot evaluation.
- [x] Generate direct-pot candidates using ghost-ball geometry and path obstruction checks.
- [x] Evaluate candidates by simulating the same PhysicsWorld used by human play.
- [x] Add five difficulty profiles controlling candidate budget, aim error and power consistency.
- [x] Add AI opponent mode and automatic turn execution.
- [x] Add legal ball-in-hand position search for the AI.
- [x] Add physics-validated bank-shot and kick-shot candidate planning.
- [x] Add two-rail object-ball planning using unfolded-table reflection.
- [x] Move AI candidate simulation off the main thread into a Web Worker.
- [x] Improve safety-ball and cue-ball position evaluation.

## Phase 5 — Polish and performance

- [x] Add a live player scoreboard with group assignment and remaining-ball counts.
- [x] Highlight the active player and match winner.
- [x] Show an explicit AI-thinking state while the opponent is preparing a shot.
- [x] Add procedural cue/pocket sound effects with a mute toggle.
- [ ] Refine lighting and add richer shot feedback.
- [x] Add reduced-motion support and keyboard focus visibility for the interactive table.
- [ ] Review touch controls and small-screen layouts in real browsers.
- [ ] Add browser compatibility and repeatable performance benchmarks.

## Cross-cutting — Localization

- [x] Support English, Simplified Chinese, Traditional Chinese and Japanese.
- [x] Translate dynamic rule-engine, foul, winner and AI shot status messages.
- [x] Add locale regression tests for runtime-interpolated messages.

## Phase 6 — Multiplayer (not active)

- Revisit only when local gameplay is stable.
- Add a network session adapter, server-authoritative commands/state, reconnect and resynchronization.
- No online infrastructure is in scope before this phase.
