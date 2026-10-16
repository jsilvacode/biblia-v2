import { expect, test } from '@playwright/test'

const promiseRegion = (page) => page.getByRole('region', { name: 'Promesa del día', exact: true })

async function settledHome(page, date) {
  await page.clock.setFixedTime(new Date(`${date}T12:00:00-03:00`))
  await page.goto('/')
  await expect(promiseRegion(page)).toHaveAttribute('aria-busy', 'false')
  await page.evaluate(async () => {
    await document.fonts.load('400 24px "Playfair Display"')
    await document.fonts.load('400 14px "Lora"')
    await document.fonts.ready
    // A viewport change can queue a style update after fonts are ready.
    // Measure the responsive layout after that update has been painted.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

test('the hero and glass keep the same height across short, medium and long promises', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    let initial
    for (const date of ['2026-02-23', '2026-08-06', '2026-10-14']) {
      await settledHome(page, date)
      const geometry = await promiseRegion(page).evaluate((hero) => {
        const quote = hero.querySelector('h1').getBoundingClientRect()
        const slot = hero.querySelector('h1').parentElement.getBoundingClientRect()
        const panel = document.querySelector('[data-testid="home-reading-panel"]')
        const picker = panel.querySelector('[data-testid="home-reading-actions"]')
        const search = panel.querySelector('[role="search"]')
        return {
          heroHeight: hero.getBoundingClientRect().height,
          panelHeight: panel.getBoundingClientRect().height,
          panelTop: panel.getBoundingClientRect().top,
          quoteFits: quote.top >= slot.top - 1 && quote.bottom <= slot.bottom + 1,
          quoteHeight: quote.height,
          quoteSpace: slot.height,
          controlAlignment: Math.abs(picker.getBoundingClientRect().left - search.getBoundingClientRect().left) + Math.abs(picker.getBoundingClientRect().width - search.getBoundingClientRect().width),
        }
      })
      expect(geometry.quoteFits, `${viewport.width}×${viewport.height}, ${date}: ${JSON.stringify(geometry)}`).toBe(true)
      expect(geometry.controlAlignment).toBeLessThanOrEqual(1)
      if (!initial) initial = geometry
      expect(geometry.heroHeight).toBe(initial.heroHeight)
      expect(geometry.panelHeight).toBe(initial.panelHeight)
      expect(geometry.panelTop).toBe(initial.panelTop)
    }
  }
})

test('loading the promise and adding reading history do not move the glass or the next section', async ({ page }) => {
  let releaseChapter
  const chapterGate = new Promise(resolve => { releaseChapter = resolve })
  await page.route('**/data/nbla/**', async route => { await chapterGate; await route.continue() })
  await page.clock.setFixedTime(new Date('2026-10-14T12:00:00-03:00'))
  await page.goto('/')
  await expect(promiseRegion(page)).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByRole('region', { name: /^(?:Última lectura|Lecturas recientes)$/ })).toHaveCount(0)
  const geometry = () => page.getByTestId('home-reading-panel').evaluate(panel => ({
    height: panel.getBoundingClientRect().height,
    top: panel.getBoundingClientRect().top,
    editorialTop: document.getElementById('home-editorial-heading').getBoundingClientRect().top,
  }))
  const loading = await geometry()
  releaseChapter()
  await expect(promiseRegion(page)).toHaveAttribute('aria-busy', 'false')
  expect(await geometry()).toEqual(loading)
  await page.evaluate(() => {
    const readings = [43, 19, 1].map((book, index) => ({ book, chapter: 1, verse: 1, progress: 10, updatedAt: 300 - index }))
    localStorage.setItem('santa_biblia_v2_recent_readings', JSON.stringify(readings))
    localStorage.setItem('santa_biblia_v2_reading', JSON.stringify(readings[0]))
  })
  await page.reload()
  await expect(promiseRegion(page)).toHaveAttribute('aria-busy', 'false')
  const isMobile = page.viewportSize().width <= 620
  const history = page.getByRole('region', { name: isMobile ? 'Última lectura' : 'Lecturas recientes', exact: true })
  await expect(history.getByRole('link')).toHaveCount(isMobile ? 1 : 3)
  await expect(history.locator('a')).toHaveCount(3)
  expect(await geometry()).toEqual(loading)
})

test('enlarged text keeps the longest translated promise complete and its actions reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.addInitScript(() => localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ bibleVersion: 'rva2015', locale: 'es' })))
  await settledHome(page, '2026-11-03')
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px' })
  const geometry = await promiseRegion(page).evaluate(hero => {
    const quote = hero.querySelector('h1').getBoundingClientRect()
    const actions = hero.querySelector('a[aria-label^="Leer capítulo"]')
    return { quoteBottom: quote.bottom, heroBottom: hero.getBoundingClientRect().bottom, root: getComputedStyle(document.documentElement).fontSize, actionsTop: actions.getBoundingClientRect().top }
  })
  expect(geometry.root).toBe('20px')
  expect(geometry.quoteBottom).toBeLessThan(geometry.heroBottom)
  expect(geometry.actionsTop).toBeGreaterThanOrEqual(geometry.quoteBottom)
  const read = promiseRegion(page).getByRole('link', { name: /Leer capítulo/ })
  await read.click()
  await expect(page).toHaveURL(/\/read\/50\/4\/12$/)
  await expect(page.locator('#verse-12')).toBeVisible()
})

test('editorial cards align on tablet and desktop and stack without clipping translated content on mobile', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'desktop' ? [768, 1024, 1440] : [320, 390, 767]
  await page.goto('/')
  for (const locale of ['es', 'en', 'pt-BR']) {
    await page.evaluate((nextLocale) => localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ locale: nextLocale, bibleVersion: 'nbla' })), locale)
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      const editorial = page.getByRole('region', { name: /También en Santa Biblia|Also in Santa Biblia|Também em Santa Biblia/ })
      const cards = editorial.getByRole('link')
      await expect(cards).toHaveCount(3)
      await page.evaluate(() => document.fonts.ready)
      expect(await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(['/reavivados', '/topics', '/studies/la-fe-de-jesus'])
      const geometry = await cards.evaluateAll((links) => links.map((link) => {
        const rect = link.getBoundingClientRect()
        const title = link.querySelector('h3')
        const image = link.querySelector('img').getBoundingClientRect()
        const action = link.querySelector('[class*="entryAction"]').getBoundingClientRect()
        return {
          x: rect.x, top: rect.top, bottom: rect.bottom, height: rect.height,
          actionBottom: action.bottom, titleFits: title.scrollWidth <= title.clientWidth,
          imageRatio: image.width / image.height, imageBeforeTitle: image.bottom <= title.getBoundingClientRect().top,
        }
      }))
      for (const card of geometry) {
        expect(card.titleFits).toBe(true)
        expect(card.imageBeforeTitle).toBe(true)
        expect(card.imageRatio).toBeCloseTo(2, 1)
        expect(card.actionBottom).toBeLessThan(card.bottom)
      }
      if (width >= 768) {
        for (const card of geometry.slice(1)) {
          expect(Math.abs(card.top - geometry[0].top)).toBeLessThanOrEqual(1)
          expect(Math.abs(card.height - geometry[0].height)).toBeLessThanOrEqual(1)
          expect(Math.abs(card.actionBottom - geometry[0].actionBottom)).toBeLessThanOrEqual(1)
        }
      } else {
        for (let index = 1; index < geometry.length; index += 1) {
          expect(geometry[index].top).toBeGreaterThan(geometry[index - 1].bottom)
          expect(geometry[index].x).toBe(geometry[0].x)
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  }
})
