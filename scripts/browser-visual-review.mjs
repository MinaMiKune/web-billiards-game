import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/'
const out = 'artifacts/browser-visual-review'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'] })
const errors = []
async function captureTable(page, path) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(120)
  // Capture only the WebGL table canvas. This avoids rasterizing the entire
  // control panel and makes pocket-mouth inspection sharper and faster.
  await page.locator('#scene-host canvas').screenshot({
    path,
    animations: 'disabled',
    timeout: 60000,
  })
}
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
page.setDefaultTimeout(12000)
page.setDefaultNavigationTimeout(20000)
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
console.log('Opening desktop game:', baseURL)
await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
await page.locator('#scene-host canvas').waitFor({ state: 'visible', timeout: 30000 })
await page.waitForTimeout(1000)
await page.locator('#dismiss-first-shot-guide').click().catch(() => {})
await captureTable(page, `${out}/table-top-desktop.png`)
console.log('Captured desktop top view')
for (const [view, file] of [['angled', 'table-angled-desktop.png'], ['side', 'table-side-desktop.png'], ['free', 'table-free-desktop.png']]) {
  await page.locator(`[data-camera="${view}"]`).click()
  await page.waitForTimeout(550)
  await captureTable(page, `${out}/${file}`)
  console.log('Captured camera:', view)
}
const canvas = await page.locator('#scene-host canvas').evaluate((el) => ({ width: el.width, height: el.height, cssWidth: el.clientWidth, cssHeight: el.clientHeight }))
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
mobile.on('pageerror', (error) => errors.push(error.message))
console.log('Opening mobile game')
await mobile.goto(baseURL, { waitUntil: 'domcontentloaded' })
await mobile.locator('#scene-host canvas').waitFor({ state: 'visible', timeout: 30000 })
await mobile.waitForTimeout(1800)
await mobile.locator('#dismiss-first-shot-guide').click().catch(() => {})
await captureTable(mobile, `${out}/table-top-mobile.png`)
console.log('Captured mobile top view')
await browser.close()
const report = { baseURL, canvas, errors, screenshots: ['table-top-desktop.png', 'table-angled-desktop.png', 'table-side-desktop.png', 'table-free-desktop.png', 'table-top-mobile.png'] }
console.log(JSON.stringify(report, null, 2))
if (canvas.width === 0 || canvas.height === 0 || errors.length) process.exit(1)
