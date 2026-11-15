# Web Billiards

A browser-based billiards simulation project built with TypeScript, Vite and Three.js.

The product direction is **game-realistic billiards**: accessible controls backed by a credible, testable physics model. The long-term experience combines a top-down playing view with angled, side and free-observation cameras.

## Current status

- [x] Three.js table scene with top, angled, side and free cameras
- [x] First-pass deterministic table-plane physics with friction, spin, ball/cushion contact and pocket capture
- [x] Aim, power, cue-ball contact-point controls and pocket-drop presentation
- [x] Local two-player American 8-ball house-rules flow, fouls and ball-in-hand
- [x] Five-level AI opponent with physics-simulated direct-shot planning
- [x] Four-language UI selection: English, Simplified Chinese, Traditional Chinese and Japanese
- [x] Live player scoreboard, group assignment and turn/winner highlighting
- [ ] Online multiplayer (reserved; not currently in development)

**[Play the GitHub Pages prototype](https://minamikune.github.io/web-billiards-game/)**

See [ROADMAP](docs/ROADMAP.md) for the phase plan.

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
- [8-ball house rules](docs/RULES.md)

## Deployment

The deployment workflow builds dist/ and publishes it to GitHub Pages on pushes to main. In repository settings, configure **Pages → Build and deployment → Source → GitHub Actions**.

Both CI and Pages deployment use npm ci with the committed package-lock.json and setup-node npm caching to ensure repeatable installs.

## Project principles

1. Physics state is independent of rendering state.
2. Every camera observes the same simulation world.
3. Human and AI players submit the same shot-command format.
4. Rules, input, rendering and sessions do not own or mutate physics internals directly.
5. Physics changes require automated tests and reproducible scenarios.
