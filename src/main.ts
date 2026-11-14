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
          <strong id="game-status" aria-live="polite">Player 1 breaks</strong>
          <span id="turn-status" class="turn-status">PLAYER 1 · BREAK</span>
        </div>
        <div class="toolbar-actions">
          <label class="opponent-control" for="opponent-mode">
            <span class="section-label">OPPONENT</span>
            <select id="opponent-mode">
              <option value="local">Local 2P</option>
              <option value="ai">AI opponent</option>
            </select>
          </label>
          <label class="opponent-control" for="ai-difficulty">
            <span class="section-label">AI LEVEL</span>
            <select id="ai-difficulty">
              <option value="1">1 · Beginner</option>
              <option value="2">2 · Amateur</option>
              <option value="3" selected>3 · Advanced</option>
              <option value="4">4 · Expert</option>
              <option value="5">5 · Master</option>
            </select>
          </label>
          <label class="power-control" for="shot-power">
            <span class="section-label">SHOT POWER</span>
            <strong id="power-value">65%</strong>
            <input id="shot-power" type="range" min="10" max="100" value="65" />
          </label>
          <button id="reset-rack" class="button button-muted" type="button">New rack</button>
        </div>
      </div>

      <div class="spin-bar">
        <div class="spin-copy">
          <span class="section-label">CUE BALL CONTACT</span>
          <strong id="spin-value">Center</strong>
          <span class="spin-description">Choose where the cue strikes the white ball</span>
        </div>
        <div id="spin-pad" class="spin-pad" role="group" tabindex="0" aria-label="Cue ball contact point. Up for follow, down for draw, left and right for side spin. Use arrow keys or pointer. Home resets to center.">
          <span class="spin-axis spin-axis-x"></span>
          <span class="spin-axis spin-axis-y"></span>
          <span class="spin-direction spin-top">FOLLOW</span>
          <span class="spin-direction spin-bottom">DRAW</span>
          <span class="spin-direction spin-left">L</span>
          <span class="spin-direction spin-right">R</span>
          <span id="spin-marker" class="spin-marker"></span>
        </div>
        <p class="spin-help">Drag the marker · Arrow keys also work · Home resets</p>
      </div>

      <div class="scene-frame">
        <div id="scene-host" class="scene-host" aria-label="Interactive 3D billiards table"></div>
        <div id="interaction-hint" class="scene-hint">DRAG BACK FROM THE CUE BALL TO AIM · RELEASE TO SHOOT</div>
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
      <span>PHASE 4 · PHYSICS-PLANNED AI OPPONENT</span>
      <span>ONLINE PLAY IS RESERVED FOR A FUTURE PHASE</span>
    </footer>
  </main>
`

new GameApp(app)
