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
    // Container-query typography can settle after fonts and the ready state.
    // Measure only after both the geometry and computed font stop changing.
    await new Promise(resolve => {
      let previous
      let stableFrames = 0
      const settle = () => {
        const opening = document.querySelector('[data-testid="home-opening"]')
        const panel = opening.querySelector('[data-testid="home-reading-panel"]')
        const heading = opening.querySelector('h1')
        const snapshot = JSON.stringify({
          bounds: [opening, panel, heading, opening.querySelector('header')].map(element => {
            const { x, y, width, height } = element.getBoundingClientRect()
            return [x, y, width, height]
          }),
          font: getComputedStyle(heading).font,
        })
        stableFrames = snapshot === previous ? stableFrames + 1 : 0
        previous = snapshot
        if (stableFrames >= 4) resolve()
        else requestAnimationFrame(settle)
      }
      requestAnimationFrame(settle)
    })
  })
}

test('the Home opening and reading panel stay stable with complete short, medium and long promises', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 720 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    let initial
    for (const date of ['2026-02-23', '2026-08-06', '2026-10-14']) {
      await settledHome(page, date)
      const geometry = await promiseRegion(page).evaluate((hero) => {
        const heading = hero.querySelector('h1')
        const quote = heading.getBoundingClientRect()
        const slot = heading.parentElement.getBoundingClientRect()
        const text = document.createRange()
        text.selectNodeContents(heading)
        const textBounds = text.getBoundingClientRect()
        const panel = document.querySelector('[data-testid="home-reading-panel"]')
        const openingElement = document.querySelector('[data-testid="home-opening"]')
        const opening = openingElement.getBoundingClientRect()
        const heroBounds = hero.getBoundingClientRect()
        const panelBounds = panel.getBoundingClientRect()
        const picker = panel.querySelector('[data-testid="home-reading-actions"]')
        const search = panel.querySelector('[role="search"]')
        const clippingAncestors = []
        // Font glyphs can exceed their line box with visible overflow. Check
        // the actual text range against any ancestor that clips its contents.
        for (let element = heading; element && openingElement.contains(element); element = element.parentElement) {
          const style = getComputedStyle(element)
          const bounds = element.getBoundingClientRect()
          const left = bounds.left + element.clientLeft
          const top = bounds.top + element.clientTop
          if (style.overflowX !== 'visible' && (textBounds.left < left - 1 || textBounds.right > left + element.clientWidth + 1)
            || style.overflowY !== 'visible' && (textBounds.top < top - 1 || textBounds.bottom > top + element.clientHeight + 1)) {
            clippingAncestors.push(element.tagName)
          }
        }
        return {
          openingHeight: opening.height,
          heroHeight: heroBounds.height,
          panelHeight: panelBounds.height,
          panelTop: panelBounds.top,
          panelLeft: panelBounds.left,
          panelBottom: panelBounds.bottom,
          heroRight: heroBounds.right,
          heroBottom: heroBounds.bottom,
          openingBottom: opening.bottom,
          quoteFits: quote.top >= slot.top - 1 && quote.bottom <= slot.bottom + 1,
          quoteComplete: textBounds.top >= slot.top - 1 && textBounds.bottom <= slot.bottom + 1 && clippingAncestors.length === 0,
          clippingAncestors,
          quoteHeight: quote.height,
          quoteSpace: slot.height,
          controlAlignment: Math.abs(picker.getBoundingClientRect().left - search.getBoundingClientRect().left) + Math.abs(picker.getBoundingClientRect().width - search.getBoundingClientRect().width),
        }
      })
      expect(geometry.quoteFits, `${viewport.width}×${viewport.height}, ${date}: ${JSON.stringify(geometry)}`).toBe(true)
      expect(geometry.quoteComplete, `${viewport.width}×${viewport.height}, ${date}: ${JSON.stringify(geometry)}`).toBe(true)
      expect(geometry.controlAlignment).toBeLessThanOrEqual(1)
      const lowerBreathingRoom = geometry.openingBottom - geometry.panelBottom
      expect(lowerBreathingRoom).toBeGreaterThanOrEqual(viewport.width <= 620 ? 24 : 40)
      if (viewport.width >= 1100) {
        expect(geometry.panelLeft).toBeGreaterThan(geometry.heroRight)
        expect(geometry.openingHeight).toBeLessThanOrEqual(720)
      } else expect(geometry.panelTop).toBeGreaterThanOrEqual(geometry.heroBottom)
      if (!initial) initial = geometry
      expect(geometry.openingHeight).toBe(initial.openingHeight)
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
  const geometry = () => page.getByTestId('home-reading-panel').evaluate(panel => {
    const opening = document.querySelector('[data-testid="home-opening"]').getBoundingClientRect()
    return {
      height: panel.getBoundingClientRect().height,
      top: panel.getBoundingClientRect().top,
      openingHeight: opening.height,
      openingBottom: opening.bottom,
      editorialTop: document.getElementById('home-editorial-heading').getBoundingClientRect().top,
    }
  })
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

test('resizing the Home opening through two columns preserves the single reading panel and search state', async ({ page }) => {
  await page.setViewportSize({ width: 1099, height: 900 })
  await settledHome(page, '2026-10-14')
  const panel = page.getByTestId('home-reading-panel')
  const input = panel.getByRole('searchbox')
  const originalPanel = await panel.elementHandle()
  const originalInput = await input.elementHandle()
  await input.fill('Juan 3:16')
  await expect(panel.getByRole('region', { name: 'Resultados de búsqueda', exact: true })).toBeVisible()

  for (const width of [1100, 1440, 1099]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(panel).toHaveCount(1)
    await expect(input).toHaveValue('Juan 3:16')
    expect(await panel.evaluate((element, original) => element === original, originalPanel)).toBe(true)
    expect(await input.evaluate((element, original) => element === original, originalInput)).toBe(true)
    const geometry = await panel.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const promise = document.querySelector('[aria-label="Promesa del día"]').getBoundingClientRect()
      return { panelLeft: rect.left, panelTop: rect.top, promiseRight: promise.right, promiseBottom: promise.bottom }
    })
    if (width >= 1100) expect(geometry.panelLeft).toBeGreaterThan(geometry.promiseRight)
    else expect(geometry.panelTop).toBeGreaterThanOrEqual(geometry.promiseBottom)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
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
      const heading = await editorial.getByRole('heading', { level: 2 }).evaluate(element => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        const section = element.closest('section').getBoundingClientRect()
        return {
          align: style.textAlign,
          family: style.fontFamily,
          displayFont: getComputedStyle(document.documentElement).getPropertyValue('--font-display').split(',')[0].replace(/["']/g, '').trim(),
          center: rect.left + rect.width / 2,
          sectionCenter: section.left + section.width / 2,
          sectionWidth: section.width,
          fits: element.scrollWidth <= element.clientWidth,
        }
      })
      expect(heading.align).toBe('center')
      expect(heading.family).toContain(heading.displayFont)
      expect(Math.abs(heading.center - heading.sectionCenter)).toBeLessThanOrEqual(1)
      expect(heading.fits).toBe(true)
      if (width === 1440) {
        expect(heading.sectionWidth).toBeGreaterThanOrEqual(1180)
        expect(heading.sectionWidth).toBeLessThanOrEqual(1220)
      }
      expect(await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).toEqual(['/reavivados', '/topics', '/studies/la-fe-de-jesus'])
      const geometry = await cards.evaluateAll((links) => links.map((link) => {
        const rect = link.getBoundingClientRect()
        const title = link.querySelector('h3')
        const image = link.querySelector('img').getBoundingClientRect()
        const action = link.querySelector('[class*="entryAction"]').getBoundingClientRect()
        return {
          x: rect.x, right: rect.right, top: rect.top, bottom: rect.bottom, height: rect.height,
          actionBottom: action.bottom, titleFits: title.scrollWidth <= title.clientWidth,
          imageRatio: image.width / image.height, imageBeforeTitle: image.bottom <= title.getBoundingClientRect().top,
        }
      }))
      for (const card of geometry) {
        expect(card.x).toBeGreaterThanOrEqual(0)
        expect(card.right).toBeLessThanOrEqual(width)
        expect(card.titleFits).toBe(true)
        expect(card.imageBeforeTitle).toBe(true)
        expect(card.imageRatio).toBeCloseTo(2.4, 1)
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
