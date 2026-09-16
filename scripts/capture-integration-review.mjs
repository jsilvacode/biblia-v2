import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const directory = 'docs/implementation/evidence/revision-integracion'
const phase = process.env.PHASE || 'final'
const enlarged = Boolean(process.env.LARGE_TEXT)
const baseUrl = process.env.SANTA_BIBLIA_CAPTURE_URL || 'http://127.0.0.1:4176'
const widths = enlarged ? [320, 390, 768, 1440] : [320, 390, 768, 950, 1440]
const routes = [
  ['home', '/'], ['biblia', '/bible'], ['buscar', '/search'], ['guardados', '/saved'],
  ['temas', '/topics'], ['lectura-tematica', '/topics/temor-ansiedad-y-paz/tengo-miedo'],
  ['curso', '/studies/la-fe-de-jesus'], ['leccion', '/studies/la-fe-de-jesus/quien-es-dios'],
  ['reavivados', '/reavivados'], ['lector', '/read/43/3'],
]
const results = []
await mkdir(directory, { recursive: true })
const browser = await chromium.launch()
try {
  for (const width of widths) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      await context.addInitScript((theme) => {
        localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({
          theme, locale: 'es', bibleVersion: 'nbla', fontFamily: 'serif',
          readerFontScale: 1, readerLineHeight: 'comfortable',
        }))
      }, theme)
      const page = await context.newPage()
      for (const [name, path] of routes) {
        await page.goto(`${baseUrl}${path}`)
        await page.locator('h1').first().waitFor()
        await page.evaluate(() => document.fonts.ready)
        if (enlarged) await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
        await page.waitForTimeout(150)
        const geometry = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth }))
        results.push({ name, width, theme, enlarged, ...geometry })
        if (width === 390 || (!enlarged && width === 1440)) {
          await page.screenshot({ path: `${directory}/${phase}-${name}-${theme}-${width}.png` })
        }
      }
      await context.close()
    }
  }
} finally {
  await browser.close()
}
await writeFile(`${directory}/${phase}-resultados.json`, JSON.stringify(results, null, 2))
console.log(JSON.stringify({ total: results.length, overflows: results.filter((result) => result.overflow) }))
if (results.some((result) => result.overflow)) process.exitCode = 1
