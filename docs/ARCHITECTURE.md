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
| Session | local player orchestration and command boundary | simulation internals |
| UI | HUD, menus and settings | authoritative game state |

### Dependency direction

- Rendering reads simulation snapshots and interpolates presentation.
- Input produces typed intent or a ShotCommand.
- Game validates turn/rule constraints before accepting a shot.
- Physics applies the accepted shot and emits deterministic shot telemetry: first cue-ball contact, pocketed ball numbers, cue-ball scratch and rail contact after first hit.
- Game consumes physics events after the simulation settles.
- AI reads the same public state snapshot as a human-facing aiming system and submits the same ShotCommand type.
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
3. Physics emits events and publishes immutable/read-only snapshots.
4. Renderer interpolates between the previous and current snapshots.
5. UI reads game/session state and never changes a ball body directly.

The 120 Hz value is an initial engineering target, not a proven optimum. Validate it on desktop and mobile hardware. Large frame gaps must be clamped and handled without unbounded catch-up loops.

## Rendering and cameras

One Three.js scene contains one table, one set of balls and one authoritative simulation state. CameraManager switches camera configurations; it does not duplicate scenes or balls.

Planned modes:
- Top: overhead playing view, optimized for aiming.
- Angled: elevated perspective for spatial understanding.
- Side: low side view for observing cue contact and ball movement.
- Free: orbit, pan and zoom for inspection.

The top camera may use orthographic projection. Perspective cameras are used for the other modes. All views must preserve a clear route back to the default playing view.

## Physics strategy

Implement a billiards-specific planar rigid-body model first. Ball centers move on the table plane; 3D sphere meshes are presentation. Track linear and angular velocity so sliding, rolling and spin can be introduced in stages. Avoid using a generic rigid-body engine as the sole source of billiards behavior.

First increments:
1. stationary state, fixed-step integration and friction deceleration;
2. equal-mass ball-ball collision and overlap correction;
3. cushion segments and collision response;
4. pocket geometry and scratch handling;
5. spin/tangential impulses and refined cushion response.

Document model assumptions and test fixtures in PHYSICS.md.

## Rules and session flow

- The 8-ball rules engine is a pure domain module. It consumes a completed-shot result and returns a new game state; it never mutates physics or rendering objects.
- The current ruleset is a documented game-oriented house-rules subset: break, open table, group assignment, first-contact fouls, no-rail foul, scratch/ball-in-hand, 8-ball win/loss and re-rack on 8-ball break.
- Cue-ball placement is validated by the physics domain against table bounds, pocket exclusion zones and other active balls.
- Call-shot/tournament variations remain future rule-profile options.

## AI decision boundary

- AI consumes a cloned physics world and game-state snapshot.
- Candidate generation uses ghost-ball geometry and unobstructed path tests.
- Each candidate is simulated through the same PhysicsWorld implementation as human shots.
- Difficulty changes candidate budget, aim error and power error; it does not change physical laws.
- Current planning covers direct-pot candidates and a simple safety fallback. Bank/kick shots, deeper planning and worker offload remain future work.

## Future multiplayer boundary

Use commands and snapshots at the session boundary. Do not add sockets, a server, matchmaking or account infrastructure now. Before online play, define server authority, command validation, simulation-version compatibility, event ordering and resynchronization.

## Non-goals for the first prototype

- Full 8-ball rule set
- AI opponents
- Online play
- Jump shots and full cue elevation dynamics
- Realistic cloth/felt deformation
- Advanced post-processing or expensive cinematic effects
