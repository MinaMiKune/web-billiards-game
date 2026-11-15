# Technical Architecture

## Product baseline

- Simulation target: game-realistic rather than laboratory-grade.
- Camera system: top-down, angled, side and free-observation views.
- Physics priority: high; correctness and repeatability take precedence over decorative effects.
- Initial game target: American 8-ball.
- Online multiplayer: out of scope for current phases. Preserve a session boundary so it can be added later without rewriting the game domain.

## Architecture rules

| Domain | Owns | Must not own |
| --- | --- | --- |
| App | startup, lifecycle, fixed/render loop coordination | billiards rules |
| Physics | ball state, motion, collision and pocket events | Three.js objects, DOM |
| Rendering | Three.js scene, models, materials, cameras | authoritative ball state |
| Input | pointer/keyboard interpretation and shot intent | direct physics mutation |
| Game | rules, turns, fouls and win conditions | rendering details |
| AI | candidate shots and decision scoring | a separate physics model |
| Audio | procedural presentation-only sound effects | simulation state |
| Session | local player orchestration and command boundary | simulation internals |
| UI | HUD, menus and settings | authoritative game state |

### Dependency direction

- Rendering reads simulation snapshots and interpolates presentation.
- Input produces typed intent or a ShotCommand.
- Game validates turn/rule constraints before accepting a shot.
- Physics applies the accepted shot and emits deterministic telemetry: first cue-ball contact, pocketed ball numbers and pocket indices, cue-ball scratch and rail contact after first hit.
- Game consumes physics events after the simulation settles.
- AI reads a cloned physics world and game-state snapshot, then submits the same ShotCommand type as a human player.
- Audio reacts to accepted shots and pocket events but never changes physics.
- LocalSession is the only session implementation in current scope. A future NetworkSession is an extension point, not current work.

## Coordinate and unit convention

- Physics uses SI units: meters, seconds and kilograms.
- The table plane is X/Z; Y is height.
- Three.js uses Y-up presentation coordinates.
- Ball radius and table dimensions are configured in meters.
- Physics never imports Three.js. Use small domain vector types in the physics package.
- Conversion to Three.js vectors happens at the rendering boundary.

## Runtime model

1. Input updates the current interaction intent.
2. A fixed-step accumulator advances physics at 120 Hz initially.
3. Physics emits events and publishes snapshots.
4. Renderer interpolates between the previous and current snapshots.
5. UI reads game/session state and never changes a ball body directly.
6. AI shot search runs in a module Web Worker using a structured-cloned physics snapshot; the main thread applies the returned ShotCommand to the authoritative world.

The 120 Hz value is an initial engineering target, not a proven optimum. Large frame gaps are clamped and catch-up steps are capped.

## Rendering and cameras

One Three.js scene contains one table, one set of balls and one authoritative simulation state. CameraManager switches camera configurations; it does not duplicate scenes or balls.

Modes:
- Top: overhead playing view, optimized for aiming.
- Angled: elevated perspective for spatial understanding.
- Side: low side view for observing cue contact and ball movement.
- Free: orbit, pan and zoom for inspection.

The interactive canvas is keyboard-focusable. Reduced-motion preferences disable orbit damping and reduce CSS animation/transition durations.

## Physics strategy

The physics layer is a billiards-specific planar rigid-body approximation. Ball centers move on the table plane; 3D sphere meshes are presentation. Linear and angular velocity are tracked to model sliding, rolling, spin and tangential impacts.

The model includes sliding-to-rolling friction, rolling resistance, follow/draw and side spin, tangential ball-ball impulses, cushion friction, finite angled pocket jaws, pocket capture and pocket-index telemetry. It does not yet include cushion height, vertical ball motion, curved jaw profiles or measured cloth/table calibration.

See PHYSICS.md for parameter baselines and explicit validation limits.

## Rules and session flow

- The 8-ball rules engine is a pure domain module. It consumes a completed-shot result and returns a new game state.
- The current ruleset supports break, open table, group assignment, first-contact fouls, no-rail foul, scratch/ball-in-hand and 8-ball win/loss.
- Optional call-shot mode validates the called ball and pocket using physics pocket-index telemetry.
- The 8-ball-on-break option supports re-rack (default) or breaker wins.
- An optional dry-break requirement checks that four distinct object balls reach a cushion after first contact.
- Cue-ball placement is validated against table bounds, pocket exclusion zones and other active balls.
- GameApp presents recent shot history, scoreboard, turn state and winner summary.

## AI decision boundary

- AI consumes a cloned physics world and game-state snapshot.
- Candidate generation covers direct pots, single-cushion bank shots, cue-ball kick shots and two-rail object-ball routes using reflected geometry.
- Candidates are evaluated through the same PhysicsWorld implementation as human shots.
- Safety scoring considers cue-ball distance and whether the opponent has an unobstructed reply.
- Difficulty changes candidate budget, aim error and power consistency; it does not change physical laws.
- AI search runs off the rendering thread in a Web Worker, with a synchronous fallback if workers are unavailable or fail.

## Future multiplayer boundary

Use commands and snapshots at the session boundary. Do not add sockets, a server, matchmaking or account infrastructure now. Before online play, define server authority, command validation, simulation-version compatibility, event ordering and resynchronization.

## Current non-goals

- Full WPA/BCA tournament rules and match formats.
- Physical calibration against measured table/shot data.
- Jump shots and full cue-elevation dynamics.
- Realistic cloth/felt deformation.
- Online play before local gameplay and validation are stable.
