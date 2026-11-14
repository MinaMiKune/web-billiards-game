import './style.css'
import { GameApp } from './app/GameApp'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root element was not found')
}

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand">
        <p class="eyebrow">WEB BILLIARDS · 3D PROTOTYPE</p>
        <h1>BREAK <span>&</span> RUN</h1>
      </div>
      <div class="topbar-meta">
        <span class="live-dot"></span>
        <span>PHYSICS PLAYGROUND</span>
      </div>
    </header>

    <section class="game-panel">
      <div class="toolbar">
        <div class="status-block">
          <span class="section-label">TABLE STATUS</span>
          <strong id="game-status" aria-live="polite">Ready to break</strong>
        </div>
        <div class="toolbar-actions">
          <label class="power-control" for="shot-power">
            <span class="section-label">SHOT POWER</span>
            <strong id="power-value">65%</strong>
            <input id="shot-power" type="range" min="10" max="100" value="65" />
          </label>
          <button id="reset-rack" class="button button-muted" type="button">New rack</button>
        </div>
      </div>

      <div class="scene-frame">
        <div id="scene-host" class="scene-host" aria-label="Interactive 3D billiards table"></div>
        <div class="scene-hint">DRAG BACK FROM THE CUE BALL TO AIM · RELEASE TO SHOOT</div>
      </div>

      <div class="camera-bar">
        <div class="camera-copy">
          <span class="section-label">CAMERA</span>
          <span>One table · four ways to view</span>
        </div>
        <div class="camera-controls" role="group" aria-label="Camera view">
          <button class="camera-button is-active" data-camera="top" type="button" aria-pressed="true">1 · Top</button>
          <button class="camera-button" data-camera="angled" type="button" aria-pressed="false">2 · Angled</button>
          <button class="camera-button" data-camera="side" type="button" aria-pressed="false">3 · Side</button>
          <button class="camera-button" data-camera="free" type="button" aria-pressed="false">4 · Free</button>
        </div>
      </div>
    </section>

    <footer>
      <span>PHASE 1 · SCENE + CAMERA + FIRST-PASS PHYSICS</span>
      <span>ONLINE PLAY IS RESERVED FOR A FUTURE PHASE</span>
    </footer>
  </main>
`

new GameApp(app)
