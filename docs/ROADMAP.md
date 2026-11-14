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
- [ ] Generate and commit package-lock.json; then use npm ci and restore npm caching.
- [ ] Enable GitHub Pages in repository settings (owner action tracked in issue #3).

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
- [ ] Calibrate friction and spin parameters against reference shots.
- [x] Add tangential ball-ball collision impulses and spin-dependent cushion rebound.
- [ ] Implement full pocket jaws and falling/drop presentation.

## Phase 3 — Rules and game flow

- American 8-ball rack and break.
- Ball group assignment, turn flow, fouls and win conditions.
- Rule tests independent from rendering.

## Phase 4 — AI opponents

- Candidate shot generation and physics-based prediction.
- Five difficulty levels using constrained planning depth, aim error and shot selection quality.
- Human and AI share the same shot-command and physics interfaces.

## Phase 5 — Polish and performance

- Sound, lighting, visual feedback, accessibility and mobile performance.
- Browser compatibility and repeatable benchmark scenarios.

## Phase 6 — Multiplayer (not active)

- Revisit only when local gameplay is stable.
- Add a network session adapter, server-authoritative commands/state, reconnect and resynchronization.
- No online infrastructure is in scope before this phase.
