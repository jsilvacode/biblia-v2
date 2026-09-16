import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = process.env.SANTA_BIBLIA_CAPTURE_URL || 'http://127.0.0.1:4176'
const outputDirectory = resolve('docs/implementation/evidence/etapa-5a-indice-curso/final')
const settingsKey = 'santa_biblia_v2_settings'
const progressKey = 'santa-biblia-v2:study:la-fe-de-jesus:v1'
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
  { name: '390-light-con-avance', hasProgress: true, theme: 'light', viewport: { width: 390, height: 844 } },
  { name: '1440-dark-con-avance', hasProgress: true, theme: 'dark', viewport: { width: 1440, height: 900 } },
]

async function capture(browser, state) {
  const context = await browser.newContext({ viewport: state.viewport })
  const page = await context.newPage()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(({ hasProgress, rootFontSize, theme }) => {
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({
      bibleVersion: 'nbla', fontFamily: 'serif', locale: 'es', readerFontScale: 1, readerLineHeight: 'comfortable', theme,
    }))
    if (hasProgress) {
      window.localStorage.setItem('santa-biblia-v2:study:la-fe-de-jesus:v1', JSON.stringify({
        version: 2,
        lastLessonSlug: 'la-santa-biblia',
        lastQuestionId: null,
        completedLessonSlugs: ['quien-es-dios'],
        courseCompletedAt: null,
        lessonProgress: {},
        updatedAt: 1780000000000,
      }))
    }
    if (rootFontSize) document.documentElement.style.fontSize = rootFontSize
  }, state)
  await page.goto(`${baseUrl}/studies/la-fe-de-jesus`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'La Fe de Jesús', exact: true }).waitFor()
  await page.screenshot({ fullPage: true, path: resolve(outputDirectory, `indice-curso-${state.name}.jpg`), quality: 84, type: 'jpeg' })
  await context.close()
}

await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch()
try {
  for (const state of states) await capture(browser, state)
} finally {
  await browser.close()
}
