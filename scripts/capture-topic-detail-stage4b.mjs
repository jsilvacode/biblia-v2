import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = process.env.SANTA_BIBLIA_CAPTURE_URL || 'http://127.0.0.1:4176'
const outputDirectory = resolve('docs/implementation/evidence/etapa-4b-ficha-tematica/final')
const states = [
  { name: '320-light', theme: 'light', viewport: { width: 320, height: 568 } },
  { name: '320-dark', theme: 'dark', viewport: { width: 320, height: 568 } },
  { name: '390-light', theme: 'light', viewport: { width: 390, height: 844 } },
  { name: '390-dark', theme: 'dark', viewport: { width: 390, height: 844 } },
  { name: '768-light', theme: 'light', viewport: { width: 768, height: 1024 } },
  { name: '768-dark', theme: 'dark', viewport: { width: 768, height: 1024 } },
  { name: '1440-light', theme: 'light', viewport: { width: 1440, height: 900 } },
  { name: '1440-dark', theme: 'dark', viewport: { width: 1440, height: 900 } },
  { name: '390-light-texto-ampliado', rootFontSize: '20px', theme: 'light', viewport: { width: 390, height: 844 } },
  { name: '390-dark-texto-ampliado', rootFontSize: '20px', theme: 'dark', viewport: { width: 390, height: 844 } },
]
const detailPath = '/topics/temor-ansiedad-y-paz/tengo-miedo?category=temor-ansiedad-y-paz&q=miedo'

async function capture(browser, state) {
  const context = await browser.newContext({ viewport: state.viewport })
  const page = await context.newPage()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(({ rootFontSize, theme }) => {
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({
      bibleVersion: 'nbla', fontFamily: 'serif', locale: 'es', readerFontScale: 1, readerLineHeight: 'comfortable', theme,
    }))
    if (rootFontSize) document.documentElement.style.fontSize = rootFontSize
  }, state)
  await page.goto(`${baseUrl}${detailPath}`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Tengo miedo', exact: true }).waitFor()
  await page.screenshot({ fullPage: true, path: resolve(outputDirectory, `ficha-tematica-${state.name}.jpg`), quality: 84, type: 'jpeg' })
  await context.close()
}

await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch()
try {
  for (const state of states) await capture(browser, state)
} finally {
  await browser.close()
}
