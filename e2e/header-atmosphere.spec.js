import { expect, test } from '@playwright/test'

async function headerAppearance(page, selector) {
  return page.locator(selector).evaluate((element) => ['', '::before', '::after'].map((pseudo) => {
    const style = getComputedStyle(element, pseudo || null)
    return {
      backgroundImage: style.backgroundImage,
      backdropFilter: style.backdropFilter,
      display: style.display,
      filter: style.filter,
      opacity: style.opacity,
    }
  }))
}

function hasVisibleBlur(layers) {
  return layers.some((layer) => {
    if (layer.display === 'none' || Number(layer.opacity) === 0) return false
    return [layer.backdropFilter, layer.filter].some((filter) => {
      const blur = filter?.match(/blur\(([\d.]+)px\)/)
      return blur && Number(blur[1]) > 0
    })
  })
}

async function typography(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight }
  })
}

test('the shared landscape and glass remain visible in site and reader headers at every supported width', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    for (const [path, selector] of [['/saved', '.site-header'], ['/read/43/3', '.reader-header']]) {
      await page.goto(path)
      for (const theme of ['light', 'dark']) {
        await page.evaluate((nextTheme) => { document.documentElement.dataset.theme = nextTheme }, theme)
        await expect.poll(async () => {
          const layers = await headerAppearance(page, selector)
          return layers.some((layer) => layer.display !== 'none' && Number(layer.opacity) > 0
            && layer.backgroundImage.includes('aurora-champagne-landscape.webp'))
        }).toBe(true)
        await expect.poll(async () => hasVisibleBlur(await headerAppearance(page, selector))).toBe(true)
      }
      if (path === '/saved' && viewport.width >= 1024) {
        await expect(page.locator('.site-header a[href="/saved"]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      }
    }
  }
})

test('Home and Bible share header typography and the book-open and settings-2 glyphs', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport)
    const appearances = []
    for (const path of ['/', '/bible']) {
      await page.goto(path)
      const header = page.locator('header[class*="homeHeader"]')
      const brand = header.getByRole('link', { name: 'Santa Biblia', exact: true })
      const settings = header.getByRole('button', { name: /Ajustes|Settings|Configurações/ })
      await expect(brand.locator('svg.lucide-book-open')).toHaveCount(1)
      await expect(settings.locator('svg.lucide-settings-2')).toHaveCount(1)
      await expect(settings.locator('svg')).toHaveAttribute('width', '17')
      const appearance = { brand: await typography(brand) }

      const headerBible = header.locator('a[href="/bible"]')
      const bottomBible = page.locator('.mobile-navigation a[href="/bible"]')
      if (viewport.width >= 1024) {
        await expect(headerBible).toBeVisible()
        await expect(headerBible.locator('svg.lucide-book-open')).toHaveCount(1)
        await expect(headerBible.locator('svg')).toHaveAttribute('width', '17')
        appearance.navigation = await typography(headerBible)
      } else {
        await expect(bottomBible).toBeVisible()
        await expect(bottomBible.locator('svg.lucide-book-open')).toHaveCount(1)
      }
      appearances.push(appearance)
    }
    expect(appearances[0]).toEqual(appearances[1])

    await page.goto('/read/43/3')
    const readerBible = viewport.width >= 1024
      ? page.locator('.reader-header__desktop-navigation a[href="/bible"]')
      : page.locator('.reader-bottom-navigation').getByRole('button', { name: /Biblia|Bible|Bíblia/, exact: true })
    await expect(readerBible).toBeVisible()
    await expect(readerBible.locator('svg.lucide-book-open')).toHaveCount(1)
  }
})

test('reducing transparency keeps a visible Home mantle surface in both themes', async ({ page, context }) => {
  const session = await context.newCDPSession(page)
  try {
    await session.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    })
    await page.goto('/')
    expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-transparency: reduce)').matches)).toBe(true)
    const mantle = page.locator('[class*="glassMantle"]')
    await expect(mantle).toBeVisible()
    for (const theme of ['light', 'dark']) {
      await page.evaluate((nextTheme) => { document.documentElement.dataset.theme = nextTheme }, theme)
      const surface = await mantle.evaluate((element) => {
        const style = getComputedStyle(element, '::before')
        return {
          background: style.backgroundColor,
          backdropFilter: style.backdropFilter,
          content: style.content,
          display: style.display,
          opacity: style.opacity,
          visibility: style.visibility,
        }
      })
      expect(surface.display).not.toBe('none')
      expect(surface.content).not.toBe('none')
      expect(surface.visibility).toBe('visible')
      expect(Number(surface.opacity)).toBeGreaterThan(0)
      expect(surface.background).not.toBe('rgba(0, 0, 0, 0)')
      expect(surface.background).not.toBe('transparent')
      expect(surface.backdropFilter).toBe('none')
    }
  } finally {
    await session.send('Emulation.setEmulatedMedia', { features: [] })
    await session.detach()
  }
})

test('the desktop glass mantle covers the full width of every editorial entry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const editorial = page.getByRole('region', { name: /También en Santa Biblia|Also in Santa Biblia|Também na Santa Bíblia/ })
  await expect(editorial.getByRole('link')).toHaveCount(3)
  const geometry = await editorial.evaluate((section) => {
    const readingPanel = document.querySelector('[data-testid="home-reading-panel"]')
    let surface = section.parentElement
    while (surface && !surface.contains(readingPanel)) surface = surface.parentElement
    if (!surface) return null
    const surfaceRect = surface.getBoundingClientRect()
    const style = getComputedStyle(surface, '::before')
    const transform = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform)
    const left = surfaceRect.left + parseFloat(style.left) + (transform?.m41 ?? 0)
    return {
      content: style.content,
      display: style.display,
      left,
      right: left + parseFloat(style.width),
      entries: Array.from(section.querySelectorAll('a')).map((entry) => {
        const rect = entry.getBoundingClientRect()
        return { left: rect.left, right: rect.right }
      }),
    }
  })
  expect(geometry).not.toBeNull()
  expect(geometry.display).not.toBe('none')
  expect(geometry.content).not.toBe('none')
  for (const entry of geometry.entries) {
    expect(geometry.left).toBeLessThanOrEqual(entry.left)
    expect(geometry.right).toBeGreaterThanOrEqual(entry.right)
  }
})

test('tablet navigation switches once without duplicated menus', async ({ page }) => {
  for (const path of ['/', '/topics', '/studies/la-fe-de-jesus', '/read/43/3']) {
    await page.goto(path)
    for (const width of [950, 1024]) {
      await page.setViewportSize({ width, height: 900 })
      const upperLink = page.locator('header a[href="/saved"]')
      const bottomLink = page.locator('.mobile-navigation a[href="/saved"], .reader-bottom-navigation a[href="/saved"]')
      if (width < 1024) {
        await expect(upperLink).toBeHidden()
        await expect(bottomLink).toBeVisible()
      } else {
        await expect(upperLink).toBeVisible()
        await expect(bottomLink).toBeHidden()
      }
    }
  }
})
