import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173/'
const out = 'artifacts/browser-visual-review'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'] })
const errors = []
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
page.setDefaultTimeout(12000)
page.setDefaultNavigationTimeout(20000)
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
console.log('Opening desktop game:', baseURL)
await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
await page.locator('#scene-host canvas').waitFor({ state: 'visible', timeout: 30000 })
await page.waitForTimeout(1800)
await page.locator('#dismiss-first-shot-guide').click().catch(() => {})
await page.locator('#scene-host canvas').screenshot({ path: `${out}/table-top-desktop.png` })
console.log('Captured desktop top view')
for (const [view, file] of [['angled', 'table-angled-desktop.png'], ['side', 'table-side-desktop.png'], ['free', 'table-free-desktop.png']]) {
  await page.locator(`[data-camera="${view}"]`).click()
  await page.waitForTimeout(1200)
  await page.locator('#scene-host canvas').screenshot({ path: `${out}/${file}` })
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
await mobile.locator('#scene-host canvas').screenshot({ path: `${out}/table-top-mobile.png` })
console.log('Captured mobile top view')
await browser.close()
const report = { baseURL, canvas, errors, screenshots: ['table-top-desktop.png', 'table-angled-desktop.png', 'table-side-desktop.png', 'table-free-desktop.png', 'table-top-mobile.png'] }
console.log(JSON.stringify(report, null, 2))
if (canvas.width === 0 || canvas.height === 0 || errors.length) process.exit(1)
