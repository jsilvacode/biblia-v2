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
    for (const [path, selector] of [['/saved', '.site-header'], ['/read/43/3', '.reader-header__bar']]) {
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
      const appearance = { brand: await typography(brand), brandX: (await brand.boundingBox()).x }

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
    const readerBrand = page.locator('.reader-header__bar').getByRole('link', { name: 'Santa Biblia', exact: true })
    expect(Math.abs((await readerBrand.boundingBox()).x - appearances[0].brandX)).toBeLessThanOrEqual(1)
    const readerBible = viewport.width >= 1024
      ? page.locator('.reader-header__desktop-navigation a[href="/bible"]')
      : page.locator('.reader-bottom-navigation').getByRole('button', { name: /Biblia|Bible|Bíblia/, exact: true })
    await expect(readerBible).toBeVisible()
    await expect(readerBible.locator('svg.lucide-book-open')).toHaveCount(1)
  }
})

test('the reader puts Back and its neutral picker below the glass bar on the reading surface', async ({ page }) => {
  for (const [width, fontSize] of [[1440, '16px'], [320, '16px'], [320, '32px']]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/read/43/3')
    await page.evaluate((size) => { document.documentElement.style.fontSize = size }, fontSize)
    const bar = page.locator('.reader-header__bar')
    const band = page.locator('.reader-header__passage-band')
    const row = page.getByTestId('reader-passage-row')
    const picker = page.getByTestId('reader-passage-picker')
    const back = row.getByRole('button', { name: /^(Volver|Back|Voltar)$/ })
    await expect(bar.getByRole('button', { name: /^(Volver|Back|Voltar)$/ })).toHaveCount(0)
    await expect(back).toContainText(/Volver|Back|Voltar/)
    await expect(picker.getByRole('combobox', { name: /^(Libro|Book|Livro)$/ })).toHaveText(/Seleccionar libro|Select a book|Selecionar livro/)
    await expect(picker.getByRole('combobox', { name: /^(Capítulo|Chapter)$/ })).toBeDisabled()
    await expect(picker.getByRole('button', { name: /^(Abrir capítulo|Open chapter)$/ })).toBeDisabled()
    const readingColor = await page.locator('.reader-page').evaluate((element) => getComputedStyle(element).backgroundColor)
    await expect(band).toHaveCSS('background-color', readingColor)
    await expect(band).toHaveCSS('backdrop-filter', 'none')
    const [barBox, bandBox, rowBox, backBox, bookBox, chapterBox, openBox] = await Promise.all([
      bar.boundingBox(), band.boundingBox(), row.boundingBox(), back.boundingBox(),
      picker.getByRole('combobox', { name: /^(Libro|Book|Livro)$/ }).boundingBox(),
      picker.getByRole('combobox', { name: /^(Capítulo|Chapter)$/ }).boundingBox(),
      picker.getByRole('button', { name: /^(Abrir capítulo|Open chapter)$/ }).boundingBox(),
    ])
    expect(bandBox.y).toBeGreaterThanOrEqual(barBox.y + barBox.height)
    expect(rowBox.x).toBeGreaterThanOrEqual(0)
    expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(width)
    expect(backBox.x + backBox.width).toBeLessThanOrEqual(bookBox.x)
    expect(bookBox.x + bookBox.width).toBeLessThanOrEqual(chapterBox.x)
    expect(chapterBox.x + chapterBox.width).toBeLessThanOrEqual(openBox.x)
    expect(Math.abs(backBox.y + backBox.height / 2 - bookBox.y - bookBox.height / 2)).toBeLessThanOrEqual(1)
    expect(Math.abs(backBox.x - rowBox.x - 7)).toBeLessThanOrEqual(1)
    expect(Math.abs(openBox.x + openBox.width - rowBox.x - rowBox.width + 7)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
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

test('Home glass covers the picker width and ends before the editorial section', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const editorial = page.getByRole('region', { name: /También en Santa Biblia|Also in Santa Biblia|Também na Santa Bíblia/ })
    await expect(editorial.getByRole('link')).toHaveCount(3)
    const geometry = await editorial.evaluate((section) => {
      const panel = document.querySelector('[data-testid="home-reading-panel"]')
      const surface = panel.closest('[class*="glassMantle"]')
      const rect = surface.getBoundingClientRect()
      const style = getComputedStyle(surface, '::before')
      const transform = new DOMMatrixReadOnly(style.transform)
      const left = rect.left + parseFloat(style.left) + transform.m41
      return {
        containsEditorial: surface.contains(section),
        bottom: rect.bottom,
        nextTop: section.getBoundingClientRect().top,
        left,
        right: left + parseFloat(style.width),
        panelLeft: panel.getBoundingClientRect().left,
        panelRight: panel.getBoundingClientRect().right,
      }
    })
    expect(geometry.containsEditorial).toBe(false)
    expect(geometry.bottom).toBeLessThan(geometry.nextTop)
    expect(geometry.left).toBeLessThanOrEqual(geometry.panelLeft)
    expect(geometry.right).toBeGreaterThanOrEqual(geometry.panelRight)
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
