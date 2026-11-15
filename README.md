# Web Billiards

A browser-based billiards simulation built with TypeScript, Vite and Three.js.

The product direction is **game-realistic billiards**: accessible controls backed by a credible, deterministic and testable physics model. One simulation is shared by the top-down, angled, side and free-observation cameras.

## Current status

- [x] Three.js table scene, numbered/striped ball models and four camera modes
- [x] Fixed-step 120 Hz physics with sliding/rolling friction, follow/draw, side spin, ball collisions, cushion friction, pocket jaws and pocket capture
- [x] Aim, power, cue-ball contact-point controls and ball-in-hand placement
- [x] Local two-player American 8-ball and five-level physics-planned AI opponent
- [x] AI direct, bank, kick and two-rail shot candidates, safety evaluation and Web Worker planning
- [x] Optional called-ball/called-pocket mode for human and AI players
- [x] Configurable 8-ball-on-break outcome: re-rack or breaker wins
- [x] Shot history, player groups, remaining-ball scoreboard and match winner summary
- [x] Procedural cue/pocket sound effects with a mute toggle
- [x] Reduced-motion support and keyboard-focusable table canvas
- [x] English, Simplified Chinese, Traditional Chinese and Japanese UI

**[Play the GitHub Pages prototype](https://minamikune.github.io/web-billiards-game/)**

The physics model is game-oriented and has deterministic software baselines, but it is **not yet calibrated against measured reference shots or a specific physical table**. See [PHYSICS](docs/PHYSICS.md) and [ROADMAP](docs/ROADMAP.md) for remaining validation work.

## Requirements

- Node.js 22
- npm 10 or newer

## Local development

~~~bash
npm install
npm run dev
~~~

## Quality checks

~~~bash
npm run typecheck
npm test
npm run build
~~~

## Architecture

- [Architecture](docs/ARCHITECTURE.md)
- [Development guide](docs/DEVELOPMENT.md)
- [Physics model and validation](docs/PHYSICS.md)
- [Roadmap](docs/ROADMAP.md)
- [8-ball rules and options](docs/RULES.md)

## Deployment

The deployment workflow builds `dist/` and publishes it to GitHub Pages on pushes to `main`. In repository settings, configure **Pages → Build and deployment → Source → GitHub Actions**.

CI and Pages deployment use `npm ci` with the committed `package-lock.json` and setup-node npm caching.

## Project principles

1. Physics state is independent of rendering state.
2. Every camera observes the same simulation world.
3. Human and AI players submit the same shot-command format.
4. Rules, input, rendering and sessions do not own or mutate physics internals directly.
5. Physics changes require automated tests and reproducible scenarios.
6. Game-realistic behavior must not be described as physically calibrated until measured validation is complete.

## Current boundaries

Online multiplayer remains reserved for a later phase. Full tournament rules, behind-the-head-string placement, measured cushion/pocket calibration, real-browser device testing and repeatable performance benchmarks remain open work.
