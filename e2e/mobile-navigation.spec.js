import { expect, test } from '@playwright/test'

test.describe('mobile navigation shell', () => {
  test('keeps the four primary destinations reachable and composes the contextual settings panel', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only navigation coverage')
    await page.goto('/')

    const navigation = page.locator('.mobile-navigation')
    await expect(navigation.getByRole('link')).toHaveCount(4)
    await expect(page.locator('.desktop-navigation')).toBeHidden()
    await expect(navigation.getByRole('link', { name: /Inicio|Home|Início/ })).toHaveAttribute('aria-current', 'page')

    const homeFooter = page.getByRole('contentinfo')
    await expect(homeFooter.getByRole('button', { name: /Apoya el proyecto|Support the project|Apoie o projeto/ })).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(homeFooter.getByRole('button')).toHaveCount(3)
    await expect(homeFooter.getByRole('link')).toHaveCount(0)

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await navigation.getByRole('link', { name: /Biblia|Bible/ }).click()

    await expect(page).toHaveURL(/\/bible$/)
    await expect(page.locator('main')).toBeFocused()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

    const settingsTrigger = page.getByRole('button', { name: /Ajustes|Settings|Configurações/ })
    await settingsTrigger.click()
    const settingsDialog = page.getByRole('dialog', { name: /Ajustes|Settings|Configurações/ })
    const downloadsHeading = settingsDialog.getByRole('heading', { name: /Descargar versiones|Download versions|Baixar versões/ })
    await expect(settingsDialog.getByRole('heading', { name: /Acerca de Santa Biblia|About Santa Biblia|Sobre Santa Bíblia/ })).toHaveCount(0)
    await downloadsHeading.scrollIntoViewIfNeeded()
    await expect(downloadsHeading).toBeVisible()
    await expect(settingsDialog.getByRole('combobox', { name: /Idioma de la interfaz|Interface language|Idioma da interface/ })).toBeVisible()
    await expect(settingsDialog.getByRole('heading', { name: /Apoya el proyecto|Support the project|Apoie o projeto/ })).toHaveCount(0)
    await expect(settingsDialog.getByRole('link', { name: /Mercado Pago|PayPal/ })).toHaveCount(0)

    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('button', { name: /Apoya el proyecto|Support the project|Apoie o projeto/ })).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(footer.getByRole('link', { name: /Mercado Pago/ })).toHaveCount(0)
    await expect(footer.getByRole('link', { name: /PayPal/ })).toHaveCount(0)
    await expect(footer.getByText('Santa Biblia v3.0', { exact: true })).toBeVisible()
    await expect(footer.getByText(/Julio Silva/)).toHaveCount(0)
    await expect(footer.locator('a[href^="mailto:"]')).toHaveCount(0)
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await expect(page).toHaveURL(/\/bible$/)
  })

  test('uses reader chrome without mounting the global header or bottom navigation', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only navigation coverage')
    await page.goto('/read/43/3/16')

    await expect(page.locator('.reader-header')).toBeVisible()
    await expect(page.locator('.reader-header__desktop-navigation')).toBeHidden()
    await expect(page.locator('.site-header')).toHaveCount(0)
    await expect(page.getByRole('contentinfo')).toHaveCount(0)
    await expect(page.locator('.mobile-navigation')).toHaveCount(0)
    await expect(page.locator('.reader-bottom-navigation').getByRole('link')).toHaveCount(3)
    const bible = page.locator('.reader-bottom-navigation').getByRole('button', { name: /Biblia|Bible|Bíblia/ })
    await expect(bible).toBeVisible()
    await expect(bible).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(bible).toHaveAttribute('aria-expanded', 'false')
    const picker = page.getByTestId('reader-passage-picker')
    const trigger = picker.locator('[data-picker-trigger="book"]')
    await expect(trigger).toHaveText(/^(Seleccionar libro|Select a book|Selecionar livro)$/)
    await bible.click()
    const books = picker.getByRole('dialog')
    await expect(books).toBeVisible()
    await expect(bible).toHaveAttribute('aria-expanded', 'true')
    await books.locator('[data-book-id="1"]').click()
    await expect(bible).toHaveAttribute('aria-expanded', 'true')
    await books.locator('[data-chapter="1"]').click()
    await expect(page).toHaveURL(/\/read\/1\/1$/)
    await expect(page.getByRole('heading', { name: /^(Génesis|Genesis|Gênesis)$/, exact: true })).toBeVisible()
    await expect(trigger).toHaveText(/^(Seleccionar libro|Select a book|Selecionar livro)$/)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    const row = page.getByTestId('reader-passage-row')
    await expect(row.getByRole('searchbox')).toBeHidden()
    const search = row.getByRole('button', { name: 'Búsqueda rápida', exact: true })
    await expect(search).toHaveAttribute('aria-expanded', 'false')
    await search.click()
    await expect(row.getByRole('searchbox')).toBeFocused()
  })

  test('opens quick search above the reader without moving it and closes each layer with Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only reader quick-search coverage')
    await page.goto('/read/43/3')
    const row = page.getByTestId('reader-passage-row')
    const trigger = row.getByRole('button', { name: 'Búsqueda rápida', exact: true })
    const panel = row.getByRole('dialog', { name: 'Búsqueda rápida', exact: true })
    const chapterHeading = page.getByRole('heading', { name: 'Juan', exact: true })
    await expect(chapterHeading).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const initialTop = (await chapterHeading.boundingBox()).y
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(panel).toBeVisible()
    expect((await chapterHeading.boundingBox()).y).toBe(initialTop)
    const input = panel.getByRole('searchbox')
    await expect(input).toBeFocused()
    await input.fill('Juan')
    const results = panel.getByRole('region', { name: 'Resultados de búsqueda', exact: true })
    const book = results.getByRole('button', { name: 'Juan Capítulos: 21', exact: true })
    await book.click()
    const chapters = page.getByRole('dialog', { name: 'Juan', exact: true })
    await expect(chapters).toBeVisible()
    // The modal makes the reader inert while preserving the underlying search.
    await expect(row.locator('.reader-header__search-panel')).toBeVisible()
    await expect(row.locator('.reader-header__search-toggle')).toHaveAttribute('aria-expanded', 'true')
    for (const viewport of [{ width: 768, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)
      await expect(chapters).toBeVisible()
      await expect(row.locator('.reader-header__search-panel')).toHaveCount(1)
    }
    await page.keyboard.press('Escape')
    await expect(chapters).toHaveCount(0)
    await expect(panel).toBeVisible()
    await expect(book).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(results).toHaveCount(0)
    await expect(panel).toBeVisible()
    await expect(input).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
    await trigger.click()
    await panel.getByRole('button', { name: 'Cerrar', exact: true }).click()
    await expect(panel).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('keeps four primary destinations and exposes settings from the header', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only navigation coverage')
    await page.goto('/plans')

    await expect(page.locator('.mobile-navigation').getByRole('link')).toHaveCount(4)
    const settings = page.getByRole('button', { name: /Ajustes|Settings|Configurações/ })
    await expect(settings).toBeVisible()
    await settings.click()
    const settingsMenu = page.getByRole('dialog', { name: /Ajustes|Settings|Configurações/ })
    await expect(settingsMenu).toBeVisible()
    await expect(settingsMenu).toHaveClass(/reader-dialog--popover/)
    await expect(page.locator('.reader-dialog-backdrop')).toHaveCount(0)
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed')

    const triggerBox = await settings.boundingBox()
    const menuBox = await settingsMenu.boundingBox()
    const viewport = page.viewportSize()
    expect(triggerBox).not.toBeNull()
    expect(menuBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(menuBox.y).toBeGreaterThanOrEqual(0)
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(viewport.height)
    expect(Math.abs(menuBox.x + menuBox.width - (triggerBox.x + triggerBox.width))).toBeLessThanOrEqual(10)
  })

  test('preserves the previous reading position on browser back', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only navigation coverage')
    await page.goto('/')
    await expect(page.locator('.home-page')).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, 300))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(150)

    await page.locator('.mobile-navigation').getByRole('link', { name: /Biblia|Bible/ }).click()
    await expect(page).toHaveURL(/\/bible$/)
    await page.goBack()

    await expect(page).toHaveURL(/\/$/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
  })

  test('moves from books to chapters and back without losing the library context', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only browser coverage')
    await page.goto('/bible')

    const selectedBook = page.getByRole('button', { name: /Apocalipsis|Revelation|Apocalipse/ })
    await selectedBook.click()

    const chapterPicker = page.getByRole('dialog', { name: /Apocalipsis|Revelation|Apocalipse/ })
    await expect(chapterPicker).toBeVisible()
    await expect(chapterPicker.getByRole('link', { name: '1', exact: true })).toBeInViewport()
    await chapterPicker.getByRole('button', { name: /Cerrar|Close|Fechar/ }).click()
    await expect(selectedBook).toBeVisible()
    await expect(selectedBook).toBeFocused()
  })

  test('keeps the compact shell free of horizontal overflow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only layout coverage')

    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)

      for (const path of ['/', '/bible', '/search', '/saved', '/plans', '/topics', '/studies/la-fe-de-jesus', '/studies/la-fe-de-jesus/quien-es-dios', '/settings', '/read/43/3']) {
        await page.goto(path)
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true)
      }
    }
  })

  test('keeps reader settings inside the contextual menu instead of over verse text', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only reader layout coverage')
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/read/43/3/16')

    await expect(page.locator('.reader-toolbar')).toHaveCount(0)
    const sections = page.getByRole('button', { name: /Abrir menú de lectura|Open reading menu|Abrir menu de leitura/ })
    await expect(sections).toBeVisible()
    await sections.click()
    const sectionDialog = page.getByRole('dialog', { name: /Opciones rápidas|Quick options|Opções rápidas/ })
    for (const control of [
      sectionDialog.getByRole('button', { name: /Reducir texto|Decrease text|Diminuir texto/ }),
      sectionDialog.getByRole('button', { name: /Aumentar texto|Increase text|Aumentar texto/ }),
      sectionDialog.getByRole('button', { name: /Cerrar|Close|Fechar/, exact: true }),
    ]) {
      const box = await control.boundingBox()
      const dialogBox = await sectionDialog.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.x).toBeGreaterThanOrEqual(dialogBox.x)
      expect(box.x + box.width).toBeLessThanOrEqual(dialogBox.x + dialogBox.width)
    }
    const settings = sectionDialog.getByRole('button', { name: /Todos los ajustes|All settings|Todos os ajustes/ })
    await expect(settings).toBeVisible()
    await settings.click()
    const settingsDialog = page.getByRole('dialog', { name: /Ajustes|Settings|Configurações/ })
    await expect(settingsDialog).toBeVisible()
    await expect(settingsDialog).toHaveClass(/reader-dialog--popover/)
    await expect(page).toHaveURL(/\/read\/43\/3\/16$/)
    await expect(page.locator('.reader-header')).toBeVisible()
    await expect(page.locator('.site-header')).toHaveCount(0)
  })
})

test.describe('desktop navigation shell', () => {
  test('puts Home first and returns from another section', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop-only navigation coverage')
    await page.goto('/search')

    const navigation = page.getByRole('banner').getByRole('navigation')
    await expect(navigation.getByRole('link')).toHaveCount(4)
    const home = navigation.getByRole('link').first()

    await expect(home).toHaveAccessibleName(/Inicio|Home|Início/)
    await expect(home).toHaveAttribute('href', '/')
    await home.click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('main')).toBeFocused()
  })
})

test.describe('editorial page composition', () => {
  test('keeps the Home hero full-bleed and separates the primary blocks', async ({ page }) => {
    await page.goto('/')

    const heroRegion = page.getByRole('region', { name: /Promesa del día|Promise of the day|Promessa do dia/ })
    // Measure the final promise rather than mixing its loading and ready layouts.
    await expect(heroRegion).toHaveAttribute('aria-busy', 'false')
    await page.evaluate(() => document.fonts.ready)
    const heroBox = await heroRegion.boundingBox()
    const homeHeaderBox = await page.locator('header[class*="homeHeader"]').boundingBox()
    const heroKickerBox = await heroRegion.getByText(/Una promesa para hoy|A promise for today|Uma promessa para hoje/).boundingBox()
    const heroHeadingBox = await heroRegion.getByRole('heading').boundingBox()
    const heroQuoteBox = await heroRegion.getByRole('heading').locator('..').boundingBox()
    const heroActionBoxes = await Promise.all([
      heroRegion.getByRole('link', { name: /Leer capítulo|Read chapter|Ler capítulo/ }).boundingBox(),
      heroRegion.getByRole('button', { name: /Compartir promesa|Share promise|Compartilhar promessa/ }).boundingBox(),
    ])
    const readingBox = await page.getByTestId('home-reading-panel').boundingBox()
    const viewport = page.viewportSize()

    expect(heroBox).not.toBeNull()
    expect(homeHeaderBox).not.toBeNull()
    expect(heroKickerBox).not.toBeNull()
    expect(heroHeadingBox).not.toBeNull()
    expect(readingBox).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(Math.abs(heroBox.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(heroBox.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(heroBox.width - viewport.width)).toBeLessThanOrEqual(1)
    // The editorial kicker is the first content beat below the header; the
    // main promise follows it with measured breathing room.
    expect(heroKickerBox.y - (homeHeaderBox.y + homeHeaderBox.height)).toBeLessThanOrEqual(70)
    expect(heroQuoteBox.y - (heroKickerBox.y + heroKickerBox.height)).toBeLessThanOrEqual(32)
    expect(heroHeadingBox.y).toBeGreaterThanOrEqual(heroQuoteBox.y - 1)
    // The hero reserves a stable quote area for every day. Its complete
    // content must fit before the reading panel, including both actions.
    for (const actionBox of heroActionBoxes) {
      expect(actionBox).not.toBeNull()
      expect(actionBox.y).toBeGreaterThan(heroHeadingBox.y + heroHeadingBox.height)
      expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(heroBox.y + heroBox.height)
    }
    // The primary reading panel follows the hero's quiet lower edge without
    // covering the promise or its actions.
    expect(readingBox.y - (heroBox.y + heroBox.height)).toBeGreaterThanOrEqual(0)
  })

  test('keeps Home and section header controls consistent and unclipped', async ({ page }) => {
    const controlSizes = []
    for (const path of ['/', '/bible']) {
      await page.goto(path)
      const header = page.locator('header[class*="homeHeader"]')
      const headerBox = await header.boundingBox()
      expect(headerBox).not.toBeNull()
      await expect(header.getByRole('link', { name: 'Santa Biblia', exact: true })).toHaveAttribute('href', '/')

      const controls = [
        header.getByRole('button', { name: /Activar modo oscuro|Activar modo claro|Use dark theme|Use light theme|Ativar modo escuro|Ativar modo claro/ }),
        header.getByRole('button', { name: /Ajustes|Settings|Configurações/ }),
      ]
      const sizes = []
      for (const control of controls) {
        await expect(control).toBeVisible()
        const box = await control.boundingBox()
        expect(box).not.toBeNull()
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.x).toBeGreaterThanOrEqual(headerBox.x)
        expect(box.y).toBeGreaterThanOrEqual(headerBox.y)
        expect(box.x + box.width).toBeLessThanOrEqual(headerBox.x + headerBox.width)
        expect(box.y + box.height).toBeLessThanOrEqual(headerBox.y + headerBox.height)
        await control.focus()
        await expect(control).toBeFocused()
        sizes.push({ width: box.width, height: box.height })
      }
      controlSizes.push(sizes)
      expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
    for (let index = 0; index < controlSizes[0].length; index += 1) {
      expect(Math.abs(controlSizes[0][index].width - controlSizes[1][index].width)).toBeLessThanOrEqual(1)
      expect(Math.abs(controlSizes[0][index].height - controlSizes[1][index].height)).toBeLessThanOrEqual(1)
    }
  })

  test('centers the shared content body on every primary section', async ({ page }) => {
    for (const path of ['/bible', '/search', '/saved', '/plans', '/topics', '/studies/la-fe-de-jesus', '/studies/la-fe-de-jesus/quien-es-dios', '/about']) {
      await page.goto(path)
      const pageBox = await page.locator('.page').boundingBox()
      const viewport = page.viewportSize()

      expect(pageBox).not.toBeNull()
      expect(viewport).not.toBeNull()
      expect(pageBox.width).toBeLessThanOrEqual(1056)
      expect(Math.abs(pageBox.x - ((viewport.width - pageBox.width) / 2))).toBeLessThanOrEqual(1)
    }

    for (const legacyPath of ['/settings']) {
      await page.goto(legacyPath)
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByRole('dialog', { name: /Ajustes|Settings|Configurações/ })).toBeVisible()
      await expect(page.getByRole('heading', { name: /Acerca de Santa Biblia|About Santa Biblia|Sobre Santa Bíblia/ })).toHaveCount(0)
    }
  })

  test('opens Reavivados and the thematic reading library from Home', async ({ page }) => {
    await page.goto('/')

    const dailyCard = page.getByRole('link', { name: /Reavivados por su Palabra|Revived by His Word|Reavivados por Sua Palavra/ })
    await expect(dailyCard).toBeVisible()
    await expect(dailyCard).toHaveAttribute('href', '/reavivados')

    const thematicCard = page.getByRole('link', { name: /Qué leer cuando|What to read when|O que ler quando/ })
    await expect(thematicCard.getByText(/Qué leer cuando|What to read when|O que ler quando/)).toBeVisible()
    await expect(thematicCard.getByText(/Guía bíblica para lo que estás viviendo|Biblical guidance for what you are going through|Orientação bíblica para o que você está vivendo/i)).toBeVisible()
    await thematicCard.click()
    await expect(page).toHaveURL(/\/topics$/)
    await expect(page.getByRole('heading', { name: /¿Qué necesitas hoy|What do you need today|Do que você precisa hoje/i })).toBeVisible()
    await page.getByRole('combobox', { name: /^(Situación|Situation|Situação)$/ }).click()
    await page.getByRole('option', { name: 'Tengo miedo', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeVisible()
    const guideUrl = page.url()
    const citation = page.getByTestId('topic-readings').getByRole('button', { name: /Salmos? 27/ })
    await citation.click()
    const reading = page.getByRole('dialog', { name: /Salmos? 27/ })
    await expect(reading.getByTestId('passage-preview-text')).toBeVisible()
    await expect(page).toHaveURL(guideUrl)
    await reading.getByRole('button', { name: /Cerrar lectura|Close reading|Fechar leitura/ }).click()
    await expect(reading).toHaveCount(0)
    await expect(citation).toBeFocused()
    await expect(page).toHaveURL(guideUrl)
  })

  test('keeps interface language inside settings and leaves only theme and settings in the top bar', async ({ page }) => {
    for (const path of ['/', '/bible', '/search']) {
      await page.goto(path)
      await expect(page.locator('header select[aria-label*="Idioma"], header select[aria-label*="language"]')).toHaveCount(0)
      const headerActions = page.locator('button[class*="headerIconButton"]')
      await expect(headerActions).toHaveCount(2)
      await page.getByRole('button', { name: /Ajustes|Settings|Configurações/ }).click()
      await expect(page.getByRole('dialog', { name: /Ajustes|Settings|Configurações/ }).getByRole('combobox', { name: /Idioma de la interfaz|Interface language|Idioma da interface/ })).toBeVisible()
      await page.keyboard.press('Escape')
    }
  })
})
