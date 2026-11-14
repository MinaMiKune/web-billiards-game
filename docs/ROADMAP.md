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
- [ ] Verify CI and GitHub Pages deployment after the pull request is opened.

## Phase 1 — 3D playable prototype

- [x] Create a Three.js scene and 3D pool table.
- [x] Add six pocket visuals and ball models.
- [x] Add top, angled, side and free camera modes.
- [x] Implement a fixed-step physics world independent of Three.js.
- [x] Add first-pass rolling deceleration, ball collision and straight cushion response.
- [x] Add basic aim/power interaction and cue-line preview.
- [ ] Validate the prototype in a real browser and tune table/camera proportions.
- [ ] Extend the physical model with pocket capture tests, better cushion segments and contact spin.

Phase 1 exit criteria:
- The scene runs in the browser and resizes correctly.
- All four camera modes inspect the same world.
- A player can aim and shoot the cue ball.
- Balls move, collide and settle without obvious tunneling or spontaneous acceleration.
- Core physics tests and production build pass.

## Phase 2 — Table behavior and controls

- Correct pocket capture geometry, pocket jaws and scratch handling.
- Sliding/rolling transitions and cue-ball contact offsets.
- Improve cue animation, aim feedback and power controls.
- Add reduced-motion and touch-friendly controls.

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
