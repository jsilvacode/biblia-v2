import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = process.env.SANTA_BIBLIA_CAPTURE_URL || 'http://127.0.0.1:4176'
const outputDirectory = resolve('docs/implementation/evidence/etapa-5b-lecciones-curso/final')
const states = [
  { name: '320-light', theme: 'light', viewport: { width: 320, height: 568 } },
  { name: '320-dark', theme: 'dark', viewport: { width: 320, height: 568 } },
  { name: '390-light', theme: 'light', viewport: { width: 390, height: 844 } },
  { name: '390-dark', theme: 'dark', viewport: { width: 390, height: 844 } },
  { name: '768-light', theme: 'light', viewport: { width: 768, height: 1024 } },
  { name: '768-dark', theme: 'dark', viewport: { width: 768, height: 1024 } },
  { name: '1440-light', theme: 'light', viewport: { width: 1440, height: 900 } },
  { name: '1440-dark', theme: 'dark', viewport: { width: 1440, height: 900 } },
  { name: '390-light-texto-ampliado', readerFontScale: 1.3, theme: 'light', viewport: { width: 390, height: 844 } },
  { name: '390-dark-texto-ampliado', readerFontScale: 1.3, theme: 'dark', viewport: { width: 390, height: 844 } },
]

async function capture(browser, state) {
  const context = await browser.newContext({ viewport: state.viewport })
  const page = await context.newPage()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(({ readerFontScale = 1, theme }) => {
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({
      bibleVersion: 'nbla', fontFamily: 'serif', locale: 'es', readerFontScale, readerLineHeight: 'comfortable', theme,
    }))
  }, state)
  await page.goto(`${baseUrl}/studies/la-fe-de-jesus/quien-es-dios`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: '¿Quién es Dios?', exact: true }).waitFor()
  await page.locator('#q-01-01 summary').click()
  await page.locator('#q-01-01').waitFor({ state: 'visible' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ fullPage: true, path: resolve(outputDirectory, `leccion-curso-${state.name}.jpg`), quality: 84, type: 'jpeg' })
  await context.close()
}

await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch()
try {
  for (const state of states) await capture(browser, state)
} finally {
  await browser.close()
}
