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

function hasVisiblePaperTexture(layers) {
  return layers.some((layer) => layer.display !== 'none' && Number(layer.opacity) > 0
    && layer.backgroundImage.includes('data:image/svg+xml'))
}

async function typography(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element)
    return { family: style.fontFamily, size: style.fontSize, weight: style.fontWeight }
  })
}

test('the paper texture and solid surface remain visible in site and reader headers at every supported width', async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    for (const [path, selector] of [['/saved', '.site-header'], ['/biblia/juan/3', '.reader-header__bar']]) {
      await page.goto(path)
      for (const theme of ['light', 'dark']) {
        await page.evaluate((nextTheme) => { document.documentElement.dataset.theme = nextTheme }, theme)
        await expect.poll(async () => hasVisiblePaperTexture(await headerAppearance(page, selector))).toBe(true)
        await expect.poll(async () => (await headerAppearance(page, selector))
          .some((layer) => layer.display !== 'none' && layer.backgroundColor !== 'rgba(0, 0, 0, 0)')).toBe(true)
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
    for (const path of ['/', '/biblia']) {
      await page.goto(path)
      const header = page.locator('header[class*="homeHeader"]')
      const brand = header.getByRole('link', { name: 'Santa Biblia', exact: true })
      const settings = header.getByRole('button', { name: /Ajustes|Settings|Configurações/ })
      await expect(brand.locator('svg.lucide-book-open')).toHaveCount(1)
      await expect(settings.locator('svg.lucide-settings-2')).toHaveCount(1)
      await expect(settings.locator('svg')).toHaveAttribute('width', '17')
      const appearance = { brand: await typography(brand), brandX: (await brand.boundingBox()).x }

      const headerBible = header.locator('a[href="/biblia"]')
      const bottomBible = page.locator('.mobile-navigation a[href="/biblia"]')
      if (viewport.width >= 1024) {
        await expect(headerBible).toBeVisible()
        await expect(headerBible.locator('svg.lucide-book-open')).toHaveCount(1)
        await expect(headerBible.locator('svg')).toHaveAttribute('width', '17')
        const { family, size, weight } = await typography(headerBible)
        appearance.navigation = { family, size }
        expect(size).toBe('14px')
        expect(weight).toBe('500')
        if (path === '/biblia') {
          await expect(headerBible).toHaveAttribute('aria-current', 'page')
          await expect(headerBible.locator('span')).toHaveCSS('text-decoration-line', 'underline')
        }
      } else {
        await expect(bottomBible).toBeVisible()
        await expect(bottomBible.locator('svg.lucide-book-open')).toHaveCount(1)
      }
      appearances.push(appearance)
    }
    expect(appearances[0]).toEqual(appearances[1])

    await page.goto('/biblia/juan/3')
    const readerBrand = page.locator('.reader-header__bar').getByRole('link', { name: 'Santa Biblia', exact: true })
    expect(Math.abs((await readerBrand.boundingBox()).x - appearances[0].brandX)).toBeLessThanOrEqual(1)
    const readerBible = viewport.width >= 1024
      ? page.locator('.reader-header__desktop-navigation a[href="/biblia"]')
      : page.locator('.reader-bottom-navigation').getByRole('button', { name: /Biblia|Bible|Bíblia/, exact: true })
    await expect(readerBible).toBeVisible()
    await expect(readerBible.locator('svg.lucide-book-open')).toHaveCount(1)
  }
})

test('the reader aligns Back, its neutral selector and quick search below the glass bar', async ({ page }) => {
  for (const [width, fontSize] of [[1440, '16px'], [1024, '16px'], [768, '16px'], [390, '16px'], [320, '16px'], [320, '32px']]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/biblia/juan/3')
    await page.evaluate((size) => { document.documentElement.style.fontSize = size }, fontSize)
    const bar = page.locator('.reader-header__bar')
    const band = page.locator('.reader-header__passage-band')
    const row = page.getByTestId('reader-passage-row')
    const picker = page.getByTestId('reader-passage-picker')
    const back = row.getByRole('button', { name: /^(Volver|Back|Voltar)$/ })
    const book = picker.locator('[data-picker-trigger="book"]')
    await expect(bar.getByRole('button', { name: /^(Volver|Back|Voltar)$/ })).toHaveCount(0)
    await expect(book).toHaveText(/Seleccionar libro|Select a book|Selecionar livro/)
    await expect(picker.getByRole('button')).toHaveCount(1)
    const search = width < 768
      ? row.getByRole('button', { name: 'Búsqueda rápida', exact: true })
      : row.getByRole('search')
    await expect(search).toBeVisible()
    const [barBox, bandBox, rowBox, backBox, bookBox, searchBox] = await Promise.all([
      bar.boundingBox(), band.boundingBox(), row.boundingBox(), back.boundingBox(), book.boundingBox(), search.boundingBox(),
    ])
    expect(bandBox.y).toBeGreaterThanOrEqual(barBox.y + barBox.height)
    expect(rowBox.x).toBeGreaterThanOrEqual(0)
    expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(width)
    expect(backBox.x + backBox.width).toBeLessThanOrEqual(bookBox.x)
    expect(bookBox.x + bookBox.width).toBeLessThanOrEqual(searchBox.x)
    const centers = [backBox, bookBox, searchBox].map(box => box.y + box.height / 2)
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1)
    if (width < 768) {
      await expect(row.getByRole('searchbox')).toBeHidden()
      for (const [control, box] of [[back, backBox], [search, searchBox]]) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1)
        expect(await control.evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius))).toBeGreaterThanOrEqual(box.width / 2)
      }
    } else {
      await expect(back).toContainText(/Volver|Back|Voltar/)
      const headerBox = await bar.locator('header').boundingBox()
      expect(Math.abs(rowBox.x - headerBox.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(rowBox.width - headerBox.width)).toBeLessThanOrEqual(1)
      expect(rowBox.width).toBeLessThanOrEqual(1100)
      const toolsBox = await row.locator('.reader-header__reading-tools').boundingBox()
      const textBounds = await page.locator('.reader-content').evaluate(element => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return { left: rect.left + parseFloat(style.paddingLeft), right: rect.right - parseFloat(style.paddingRight) }
      })
      expect(toolsBox.x).toBeGreaterThanOrEqual(textBounds.left - 1)
      expect(toolsBox.x + toolsBox.width).toBeLessThanOrEqual(textBounds.right + 1)
      if (width === 1440) {
        expect(Math.abs(toolsBox.x - textBounds.left)).toBeLessThanOrEqual(1)
        expect(Math.abs(toolsBox.x + toolsBox.width - textBounds.right)).toBeLessThanOrEqual(1)
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('reader dropdowns and search results scroll behind the sticky header', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const kind of ['picker', 'search']) {
      await page.goto('/biblia/juan/3')
      const row = page.getByTestId('reader-passage-row')
      await expect(page.getByRole('heading', { name: 'Juan', exact: true })).toBeVisible()
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      let overlay
      if (kind === 'picker') {
        const picker = page.getByTestId('reader-passage-picker')
        await picker.locator('[data-picker-trigger="book"]').click()
        overlay = picker.getByRole('dialog')
      } else {
        if (width < 768) await row.getByRole('button', { name: 'Búsqueda rápida', exact: true }).click()
        await row.getByRole('searchbox').fill('Juan')
        overlay = row.getByRole('region', { name: 'Resultados de búsqueda', exact: true })
      }
      await expect(overlay).toBeVisible()
      const rowTop = (await row.boundingBox()).y
      await overlay.evaluate(element => {
        const bar = document.querySelector('.reader-header__bar').getBoundingClientRect()
        const top = element.getBoundingClientRect().top
        window.scrollBy({ top: top - bar.bottom + 20, behavior: 'instant' })
      })
      await expect.poll(() => overlay.evaluate(element => {
        const overlayRect = element.getBoundingClientRect()
        const bar = document.querySelector('.reader-header__bar').getBoundingClientRect()
        const left = Math.max(overlayRect.left, bar.left)
        const right = Math.min(overlayRect.right, bar.right)
        const top = Math.max(overlayRect.top, bar.top)
        const bottom = Math.min(overlayRect.bottom, bar.bottom)
        if (right <= left || bottom <= top || getComputedStyle(element).visibility === 'hidden') return false
        const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
        return Boolean(hit?.closest('.reader-header'))
      }), { message: `${kind} must remain behind the header at ${width}px` }).toBe(true)
      expect((await row.boundingBox()).y).toBeLessThan(rowTop)
    }
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

test('the matte opal Home panel keeps its shape, soft light and texture in either theme', async ({ page }) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const editorial = page.getByRole('region', { name: /También en Santa Biblia|Also in Santa Biblia|Também na Santa Bíblia/ })
    await expect(editorial.getByRole('link')).toHaveCount(4)
    for (const theme of ['light', 'dark']) {
      await page.evaluate((nextTheme) => { document.documentElement.dataset.theme = nextTheme }, theme)
      const geometry = await editorial.evaluate((section) => {
        const panel = document.querySelector('[data-testid="home-reading-panel"]')
        const surface = panel.closest('[class*="glassMantle"]')
        const rect = surface.getBoundingClientRect()
        const style = getComputedStyle(surface, '::before')
        const texture = getComputedStyle(surface, '::after')
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const context = canvas.getContext('2d')
        context.fillStyle = style.backgroundColor
        context.fillRect(0, 0, 1, 1)
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
          mask: style.maskImage,
          webkitMask: style.webkitMaskImage,
          blur: style.backdropFilter,
          background: style.backgroundColor,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          opacity: context.getImageData(0, 0, 1, 1).data[3] / 255 * Number(style.opacity),
          lighting: style.backgroundImage,
          border: style.borderTopStyle,
          borderWidth: style.borderTopWidth,
          radii: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius],
          shadow: style.boxShadow,
          texture: { content: texture.content, image: texture.backgroundImage, opacity: Number(texture.opacity), mask: texture.maskImage, blur: texture.backdropFilter, filter: texture.filter, animation: texture.animationName },
          filter: style.filter,
          animation: style.animationName,
        }
      })
      expect(geometry.containsEditorial).toBe(false)
      expect(geometry.bottom).toBeLessThan(geometry.nextTop)
      expect(geometry.left).toBeLessThanOrEqual(geometry.panelLeft + 1)
      expect(geometry.right).toBeGreaterThanOrEqual(geometry.panelRight - 1)
      expect(geometry.mask).toBe('none')
      expect(geometry.webkitMask).toBe('none')
      expect(geometry.blur).toBe('none')
      expect(geometry.opacity).toBeGreaterThanOrEqual(.95)
      expect(geometry.lighting).not.toBe('none')
      expect(geometry.background).not.toBe(geometry.bodyBackground)
      expect(geometry.border).toBe('none')
      expect(geometry.borderWidth).toBe('0px')
      for (const radius of geometry.radii) expect(parseFloat(radius)).toBeGreaterThan(0)
      expect(new Set(geometry.radii).size).toBe(1)
      expect(geometry.shadow).not.toBe('none')
      expect(geometry.filter).not.toContain('blur(')
      expect(geometry.animation).toBe('none')
      expect(geometry.texture.content).not.toBe('none')
      expect(geometry.texture.image).not.toBe('none')
      expect(geometry.texture.opacity).toBeGreaterThan(0)
      expect(geometry.texture.mask).toBe('none')
      expect(geometry.texture.blur).toBe('none')
      expect(geometry.texture.filter).not.toContain('blur(')
      expect(geometry.texture.animation).toBe('none')
    }
  }
})

test('Home loads one responsive photograph and cuts it at the opening base in both themes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ theme: 'light', locale: 'es', bibleVersion: 'nbla' })))
  for (const width of [320, 768, 1440]) {
    // Resize away from Home so its previous picture cannot request a new
    // candidate while the next navigation is being prepared.
    await page.goto('/biblia')
    await page.setViewportSize({ width, height: 900 })
    const requestedImages = []
    const onRequest = request => {
      if (/\/assets\/home-landscape-v\d+-/.test(request.url())) requestedImages.push(request.url())
    }
    page.on('request', onRequest)
    await page.goto('/')
    const image = page.locator('picture img')
    await image.evaluate(img => img.decode())
    const source = await image.evaluate(img => img.currentSrc)
    expect(source.includes('-mobile-')).toBe(width <= 620)
    expect(new Set(requestedImages)).toEqual(new Set([source]))
    expect(requestedImages).toHaveLength(1)
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark') await page.getByRole('button', { name: /Activar modo oscuro|Use dark theme|Usar tema escuro/ }).click()
      const geometry = await image.evaluate(img => {
        const photograph = img.parentElement.getBoundingClientRect()
        const panel = document.querySelector('[data-testid="home-reading-panel"]').getBoundingClientRect()
        const openingElement = img.closest('[data-testid="home-opening"]')
        const opening = openingElement.getBoundingClientRect()
        const overlay = getComputedStyle(openingElement, '::after')
        const picture = getComputedStyle(img.parentElement)
        return {
          top: photograph.top, openingTop: opening.top, bottom: photograph.bottom, openingBottom: opening.bottom, panelBottom: panel.bottom,
          overlayBottom: opening.top + parseFloat(overlay.top) + parseFloat(overlay.height),
          pictureMask: picture.maskImage, pictureWebkitMask: picture.webkitMaskImage, overlayMask: overlay.maskImage,
          editorialTop: document.getElementById('home-editorial-heading').getBoundingClientRect().top,
          background: getComputedStyle(document.querySelector('.home-page')).backgroundColor,
          bodyBackground: getComputedStyle(document.body).backgroundColor,
        }
      })
      expect(geometry.top).toBe(geometry.openingTop)
      expect(Math.abs(geometry.bottom - geometry.openingBottom)).toBeLessThanOrEqual(1)
      expect(Math.abs(geometry.overlayBottom - geometry.openingBottom)).toBeLessThanOrEqual(1)
      expect(geometry.bottom).toBeGreaterThanOrEqual(geometry.panelBottom - 1)
      expect(geometry.pictureMask).toBe('none')
      expect(geometry.pictureWebkitMask).toBe('none')
      expect(geometry.overlayMask).toBe('none')
      expect(geometry.bottom).toBeLessThan(geometry.editorialTop)
      expect(geometry.background).toBe('rgba(0, 0, 0, 0)')
      expect(geometry.bodyBackground).not.toBe('rgba(0, 0, 0, 0)')
      expect(await image.evaluate(img => img.currentSrc)).toBe(source)
      expect(requestedImages).toHaveLength(1)
    }
    page.off('request', onRequest)
  }
})

test('tablet navigation switches once without duplicated menus', async ({ page }) => {
  for (const path of ['/', '/topics', '/fe-de-jesus', '/biblia/juan/3']) {
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
