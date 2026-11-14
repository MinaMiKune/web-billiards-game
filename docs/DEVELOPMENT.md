# Development Guide

## Environment

- Node.js 22
- npm 10+
- A modern browser with WebGL 2 support for the 3D prototype

## Commands

~~~bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
~~~

## Code conventions

- TypeScript strict mode; avoid any.
- Keep physics deterministic and DOM/WebGL independent.
- Do not store authoritative physics state in Three.js meshes.
- Use meters, seconds and kilograms in physics code.
- Keep tunable simulation values in named configuration objects.
- Prefer small modules with one responsibility.
- Use descriptive names and explicit return types for public APIs.
- Avoid hidden global state; inject configuration/dependencies where useful.
- Do not add placeholder modules without a concrete caller or test.

## Testing policy

- Unit-test math, collision response, friction and game rules.
- Use fixed initial conditions and explicit expected tolerances.
- Add regression fixtures for every corrected physics defect.
- Keep rendering tests separate from deterministic physics tests.
- A physics change is not complete until related tests pass.

## Git workflow

- main: stable and deployable.
- feature/*: feature work.
- fix/*: defect fixes.
- Use pull requests to merge work into main.
- Keep commits focused and use Conventional Commits.

Examples:

~~~text
feat: add camera presets
fix: correct cushion collision response
test: add equal-mass collision fixtures
refactor: separate physics from rendering
docs: document simulation units
~~~

## Pull request checklist

- [ ] TypeScript type check passes.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] No new console errors in the browser.
- [ ] Physics changes include regression tests.
- [ ] User-facing behavior and known limitations are described.
- [ ] Documentation is updated where architecture or parameters changed.

## Dependencies and lockfile

The repository currently has no committed package-lock.json. Until it is generated and committed, CI uses npm install and does not enable npm dependency caching. Once the lockfile is committed, switch to npm ci and re-enable setup-node npm caching.
