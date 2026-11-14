# Web Billiards

A lightweight browser billiards game built with TypeScript, HTML Canvas and Vite.

## Play locally

```bash
npm install
npm run dev
```

## Build and check

```bash
npm run typecheck
npm run build
npm run preview
```

## Controls

- Drag backwards from the white cue ball to aim.
- Release to shoot.
- Adjust shot power with the slider.
- Choose **New rack** to reset the table.

## Deployment

The GitHub Actions workflow builds the app and publishes `dist/` to GitHub Pages whenever changes are pushed to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Tech

- TypeScript
- HTML Canvas 2D
- Vite
- GitHub Actions
