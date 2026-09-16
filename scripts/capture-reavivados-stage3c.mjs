import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = process.env.SANTA_BIBLIA_CAPTURE_URL || 'http://127.0.0.1:4176'
const outputDirectory = resolve('docs/implementation/evidence/etapa-3c-reavivados/final')
const sequence = [
  [9, 24, 31], [10, 1, 24], [11, 1, 22], [12, 1, 25], [13, 1, 29],
  [14, 1, 36], [15, 1, 10], [16, 1, 13], [17, 1, 10], [18, 1, 42], [19, 1, 146],
]
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

function readingForDate(date) {
  const [year, month, day] = date.split('-').map(Number)
  let remaining = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000)
  for (const [book, from, to] of sequence) {
    if (remaining <= to - from) return { book, chapter: from + remaining }
    remaining -= to - from + 1
  }
  throw new Error(`No reading for ${date}`)
}

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
  await page.route('**/api/rpsp?date=*', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')
    const reference = readingForDate(date)
    await route.fulfill({
      contentType: 'application/json',
      json: {
        checkedAt: '2026-09-15T15:00:00.000Z',
        date,
        episode: {
          audioUrl: 'https://vod.nuevotiempo.org/ReavivadosA/Reavivados15-09-2026.mp3', durationSeconds: null,
          id: `rpsp-${date}`, language: 'es', mimeType: 'audio/mpeg', presenter: null,
          publishedAt: '2026-09-15T12:00:00.000Z',
          sourcePageUrl: 'https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/reavivados-prueba/', title: 'Reavivados por su Palabra',
        },
        provenance: 'capture', reference, schemaVersion: 1, status: 'ready',
      },
    })
  })
  await page.goto(`${baseUrl}/reavivados`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Reproducir reflexión' }).waitFor()
  await page.screenshot({ path: resolve(outputDirectory, `reavivados-${state.name}.jpg`), quality: 84, type: 'jpeg' })
  await context.close()
}

await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch()
try {
  for (const state of states) await capture(browser, state)
} finally {
  await browser.close()
}
