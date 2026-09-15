import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from '@playwright/test'

const baseUrl = process.env.SANTA_BIBLIA_CAPTURE_URL || 'http://127.0.0.1:4176'
const baseline = process.argv.includes('--baseline')
const outputDirectory = resolve(
  'docs/implementation/evidence/etapa-1-home',
  baseline ? 'baseline' : 'final',
)

const viewports = baseline
  ? [
      { name: '390', width: 390, height: 844 },
      { name: '1440', width: 1440, height: 900 },
    ]
  : [
      { name: '320', width: 320, height: 568 },
      { name: '390', width: 390, height: 844 },
      { name: '768', width: 768, height: 1024 },
      { name: '1440', width: 1440, height: 900 },
    ]

const states = baseline
  ? [
      { theme: 'light', history: false },
      { theme: 'light', history: true },
    ]
  : [
      { theme: 'light', history: false },
      { theme: 'light', history: true },
      { theme: 'dark', history: false },
      { theme: 'dark', history: true },
    ]

const enlargedStates = baseline
  ? []
  : viewports.map((viewport) => ({
      history: true,
      rootFontSize: '20px',
      theme: 'light',
      viewport,
    }))

function readingState(history) {
  return history
    ? { book: 43, chapter: 3, verse: 16, progress: 42, updatedAt: 1_789_876_543_210 }
    : null
}

function settingsState(theme) {
  return {
    bibleVersion: 'nbla',
    fontFamily: 'serif',
    locale: 'es',
    readerFontScale: 1,
    readerLineHeight: 'comfortable',
    theme,
  }
}

async function capture(browser, { history, rootFontSize = null, theme, viewport }) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(({ historyValue, rootSize, settings }) => {
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify(settings))
    if (historyValue) {
      window.localStorage.setItem('santa_biblia_v2_reading', JSON.stringify(historyValue))
    } else {
      window.localStorage.removeItem('santa_biblia_v2_reading')
    }
    if (rootSize) document.documentElement.style.fontSize = rootSize
  }, {
    historyValue: readingState(history),
    rootSize: rootFontSize,
    settings: settingsState(theme),
  })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Elegir (?:una lectura|libro y capítulo)/ }).waitFor()

  const suffix = rootFontSize ? `-texto-ampliado` : ''
  const historyName = history ? 'con-historial' : 'sin-historial'
  const filename = `home-${viewport.name}-${theme}-${historyName}${suffix}.jpg`
  await page.screenshot({ fullPage: true, path: resolve(outputDirectory, filename), quality: 82, type: 'jpeg' })
  await context.close()
}

await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch()
try {
  for (const viewport of viewports) {
    for (const state of states) {
      await capture(browser, { ...state, viewport })
    }
  }

  for (const state of enlargedStates) {
    await capture(browser, state)
  }
} finally {
  await browser.close()
}
