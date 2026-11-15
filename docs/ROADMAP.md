# Development Roadmap

Product direction (2026-11-15): game-first Web Billiards. The default experience must feel like an immediately playable 8-ball game; simulation fidelity is an invisible foundation, not the primary UI.

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
- [x] Document the measured-shot capture and parameter-fitting protocol.
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
- [x] Add an optional four-object-ball-to-rail requirement for dry breaks.
- [x] Restrict break-foul ball in hand to behind the head string.
- [ ] Add remaining tournament foul and ball-in-hand variations.
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
- [x] Refine table lighting with a soft overhead pool-hall spotlight.
- [x] Add richer shot feedback through AI route status, shot history and procedural audio.
- [x] Add reduced-motion support and keyboard focus visibility for the interactive table.
- [ ] Review touch controls and small-screen layouts in real browsers.
- [x] Add repeatable AI and fixed-step physics performance benchmarks.
- [ ] Add cross-browser compatibility tests and small-screen browser verification.

## Cross-cutting — Localization

- [x] Support English, Simplified Chinese, Traditional Chinese and Japanese.
- [x] Translate dynamic rule-engine, foul, winner and AI shot status messages.
- [x] Add locale regression tests for runtime-interpolated messages.

## Phase 5B — Game-first experience redesign

- [x] Record the product pivot and player-facing experience principles in `docs/GAMEPLAY_REDESIGN.md`.
- [x] Replace simulator-facing labels with player-facing match language and strengthen the playfield/turn visual hierarchy.
- [x] Reorganize advanced rule options behind progressive disclosure.
- [x] Add a persistent first-shot guide that explains aim, power and release; dismiss it after the first recorded shot or explicit dismissal.
- [x] Show live power percentage and contextual release/shot-in-motion guidance during pointer aiming.
- [x] Increase the shot-power slider's touch target and expose its live value to assistive technology.
- [x] Use a slightly larger cue-ball drag start target for touch pointers while preserving mouse precision.
- [x] Recover aim and spin interactions cleanly when the browser cancels or unexpectedly releases pointer capture.
- [x] Announce turn changes through a polite live region for assistive technology.
- [x] Reflow the four camera selectors into large, two-column touch targets on narrow phones.
- [x] Remember the player's preferred camera view between visits.
- [x] Restore the selected local/AI game mode and AI difficulty on the next visit.
- [ ] Complete touch-first layout verification at 320px and on real mobile browsers.
- [x] Add a one-tap rematch action beside the completed-match result while preserving the selected game mode and AI difficulty.
- [x] Show a localized latest-shot outcome callout that distinguishes pots, fouls and dry shots.
- [x] Make camera controls wrap into a compact 2×2 layout below 380px with 44px+ touch targets.
- [ ] Complete real-device touch/browser verification at 320px and cross-browser checks.

## Phase 5C — Visual, physical-feedback and mobile tactile rebuild (active)

- [x] Replace flat table colors with generated felt-weave and wood-grain surface textures.
- [x] Add a tapered 3D cue model with shaft, butt, wrap, ferrule and tip during aiming.
- [x] Add per-ball contact shadows that track pocket-drop presentation.
- [x] Add best-effort mobile vibration feedback for cue strike, first-contact result and pocket events, with unsupported-device fallback.
- [x] Add distinct procedural audio primitives for ball and rail impacts.
- [x] Emit deterministic per-step ball/rail contact events and connect impact audio and haptics at the moment of contact.
- [ ] Replace procedural presentation assets with licensed, authored high-resolution PBR assets and documented attribution.
- [ ] Validate cue proportions, table details, shadows, sound mix and haptic patterns on real devices.
- [ ] Rework and validate collision/friction integration against captured reference shots; deterministic software tests are not physical calibration.

## Phase 5D — Physics solver and contact dynamics (active)

- [x] Subdivide oversized physics deltas into safe 1/120-second maximum integration steps.
- [x] Upgrade ball-ball tangential impulse calculation to use direction-specific rotational effective mass.
- [x] Improve penetration correction with slop and partial correction; suppress low-speed restitution jitter.
- [x] Expand sequential collision resolution to six passes and deduplicate per-pair contact feedback events.
- [x] Add deterministic regression tests for high-delta tunneling, side-spin transfer and event deduplication.
- [ ] Validate solver behavior against captured reference-shot datasets and stress-test dense multi-ball clusters.
- [ ] Add vertical ball motion, jump/massé and measured cushion/jaw geometry in later physics increments.

## Phase 5E — Vertical ball dynamics (active)

- [x] Add ball height and vertical velocity to authoritative simulation state and render interpolation.
- [x] Support optional cue elevation for elevated cue-ball launch trajectories.
- [x] Integrate gravity, airborne cloth-friction suppression and damped cloth landing response.
- [x] Upgrade ball-ball collision geometry and impulses to three dimensions, including vertical impulse transfer.
- [x] Allow elevated balls to clear the simplified cushion nose and update airborne contact shadows.
- [x] Add deterministic tests for elevated shots, airborne friction, 3D ball contacts and cushion clearance.
- [ ] Calibrate cue elevation, jump limits, landing bounce and cushion height against measured shots.
- [x] Add a responsive, localized player-facing 0–25° cue-elevation slider and pitch the 3D cue model to match.
- [ ] Validate elevation range, jump limits and landing bounce against measured shots before exposing advanced masse/jump-shot presets.

## Phase 6 — Release readiness (active before stable 1.0)

- [ ] Complete gameplay acceptance across full local and AI matches.
- [ ] Run the real-device and cross-browser matrix in docs/BROWSER_QA.md and commit dated evidence.
- [ ] Collect reference-table measurements and measured-shot trajectories; fit and validate physics against held-out shots.
- [ ] Complete the release gates in docs/RELEASE_READINESS.md.
- [ ] Publish a versioned GitHub Release only after the exact tagged commit passes CI and Pages deployment.

Release claims must remain explicit: deterministic game-realistic physics is not the same as measured physical calibration.

## Phase 7 — Multiplayer (not active)

- Revisit only when local gameplay is stable.
- Add a network session adapter, server-authoritative commands/state, reconnect and resynchronization.
- No online infrastructure is in scope before this phase.
