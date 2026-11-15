import './style.css'
import { GameApp } from './app/GameApp'
import { LOCALES, setLocale, type Locale } from './i18n'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root element was not found')
}

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand">
        <p class="eyebrow">WEB BILLIARDS · PLAY NOW</p>
        <h1>BREAK <span>&</span> RUN</h1>
      </div>
      <div class="topbar-meta">
        <span class="live-dot"></span>
        <span>8-BALL MATCH</span>
        <label class="language-control" for="language-select"><span class="section-label">LANGUAGE</span><select id="language-select" aria-label="Language"><option value="en">English</option><option value="zh-CN">简体中文</option><option value="zh-TW">繁體中文</option><option value="ja">日本語</option></select></label>
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
          <label class="opponent-control" for="break-requirement">
            <span class="section-label">BREAK REQUIREMENT</span>
            <select id="break-requirement">
              <option value="relaxed">Relaxed</option>
              <option value="four-rails">4 object balls to rails</option>
            </select>
          </label>
          <label class="opponent-control" for="break-eight-rule">
            <span class="section-label">8-BALL ON BREAK</span>
            <select id="break-eight-rule">
              <option value="rerack">Re-rack</option>
              <option value="breaker-wins">Breaker wins</option>
            </select>
          </label>
          <label class="call-shot-toggle" for="call-shot-toggle">
            <input id="call-shot-toggle" type="checkbox" />
            <span class="section-label">CALL SHOT</span>
          </label>
          <label class="call-shot-control" for="call-ball">
            <span class="section-label">CALL BALL</span>
            <select id="call-ball" disabled>
              <option value="">Select ball</option>
              <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option>
            </select>
          </label>
          <label class="call-shot-control" for="call-pocket">
            <span class="section-label">CALL POCKET</span>
            <select id="call-pocket" disabled>
              <option value="">Select pocket</option>
              <option value="1">1 · Top left</option>
              <option value="2">2 · Top middle</option>
              <option value="3">3 · Top right</option>
              <option value="4">4 · Bottom left</option>
              <option value="5">5 · Bottom middle</option>
              <option value="6">6 · Bottom right</option>
            </select>
          </label>
          <label class="sound-toggle" for="sound-toggle">
            <input id="sound-toggle" type="checkbox" checked />
            <span class="section-label">SOUND</span>
          </label>
          <label class="power-control" for="shot-power">
            <span class="section-label">SHOT POWER</span>
            <strong id="power-value">65%</strong>
            <input id="shot-power" type="range" min="10" max="100" value="65" />
          </label>
          <button id="reset-rack" class="button button-muted" type="button">New rack</button>
        </div>
      </div>

      <section class="scoreboard" aria-label="Player scores and remaining balls">
        <article id="player-one-card" class="player-card is-current">
          <div class="player-card-copy">
            <span id="player-one-name" class="player-name">PLAYER 1</span>
            <strong id="player-one-group" class="player-group" data-group="open">OPEN TABLE</strong>
          </div>
          <div class="player-ball-count">
            <strong id="player-one-count">15</strong>
            <span>BALLS LEFT</span>
          </div>
        </article>
        <span class="score-divider" aria-hidden="true">VS</span>
        <article id="player-two-card" class="player-card">
          <div class="player-card-copy">
            <span id="player-two-name" class="player-name">PLAYER 2</span>
            <strong id="player-two-group" class="player-group" data-group="open">OPEN TABLE</strong>
          </div>
          <div class="player-ball-count">
            <strong id="player-two-count">15</strong>
            <span>BALLS LEFT</span>
          </div>
        </article>
      </section>

      <section class="match-history" aria-label="Match history">
        <div class="match-history-header">
          <span class="section-label">SHOT HISTORY</span>
          <strong id="match-summary" class="match-summary" hidden aria-live="polite"></strong>
        </div>
        <ol id="shot-history" class="shot-history">
          <li class="history-empty">No shots recorded yet</li>
        </ol>
      </section>

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
        <div id="interaction-hint" class="scene-hint">DRAG BACK FROM THE WHITE BALL TO AIM · RELEASE TO SHOOT</div>
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

const languageSelect = app.querySelector<HTMLSelectElement>('#language-select')
const savedLocale = window.localStorage.getItem('billiards-locale') as Locale | null
const initialLocale: Locale = savedLocale && LOCALES.some((item) => item.value === savedLocale) ? savedLocale : 'zh-CN'
setLocale(initialLocale)
languageSelect?.addEventListener('change', () => {
  const locale = languageSelect.value as Locale
  setLocale(locale)
  window.localStorage.setItem('billiards-locale', locale)
  window.dispatchEvent(new Event('billiards-locale-change'))
})
new GameApp(app)
