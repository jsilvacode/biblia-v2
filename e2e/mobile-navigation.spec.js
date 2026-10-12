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
    await expect(homeFooter.getByText(/Apoya el proyecto|Support the project|Apoie o projeto/)).toBeVisible()
    await expect(homeFooter.getByRole('link', { name: /Mercado Pago/ })).toBeVisible()
    await expect(homeFooter.getByRole('link', { name: /PayPal/ })).toBeVisible()

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
    await expect(footer.getByText(/Apoya el proyecto|Support the project|Apoie o projeto/)).toHaveCount(0)
    await expect(footer.getByRole('link', { name: /Mercado Pago/ })).toHaveCount(0)
    await expect(footer.getByRole('link', { name: /PayPal/ })).toHaveCount(0)
    await expect(footer.getByText('Santa Biblia v3.0', { exact: true })).toBeVisible()
    await expect(footer.getByText(/Julio Silva/)).toBeVisible()
    await expect(footer.getByRole('link', { name: 'jsilvacode@gmail.com' })).toBeVisible()
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

    const chapterPicker = page.getByRole('region', { name: /Capítulos|Chapters/ })
    await expect(chapterPicker).toBeVisible()
    await expect(chapterPicker.getByRole('link', { name: '1', exact: true })).toBeInViewport()
    await chapterPicker.getByRole('button', { name: /Todos los libros|All books|Todos os livros/ }).click()
    await expect(selectedBook).toBeVisible()
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

    const heroBox = await page.getByRole('region', { name: /Promesa del día|Promise of the day|Promessa do dia/ }).boundingBox()
    const homeHeaderBox = await page.locator('header[class*="homeHeader"]').boundingBox()
    const heroRegion = page.getByRole('region', { name: /Promesa del día|Promise of the day|Promessa do dia/ })
    const heroKickerBox = await heroRegion.getByText(/Una promesa para hoy|A promise for today|Uma promessa para hoje/).boundingBox()
    const heroHeadingBox = await heroRegion.getByRole('heading').boundingBox()
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
    expect(heroHeadingBox.y - (heroKickerBox.y + heroKickerBox.height)).toBeLessThanOrEqual(32)
    // The hero adapts to the promise length and viewport height. Its complete
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
        expect(box.width).toBeGreaterThanOrEqual(40)
        expect(box.height).toBeGreaterThanOrEqual(40)
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
    for (const path of ['/bible', '/search', '/saved', '/plans', '/topics', '/studies/la-fe-de-jesus', '/studies/la-fe-de-jesus/quien-es-dios']) {
      await page.goto(path)
      const pageBox = await page.locator('.page').boundingBox()
      const viewport = page.viewportSize()

      expect(pageBox).not.toBeNull()
      expect(viewport).not.toBeNull()
      expect(pageBox.width).toBeLessThanOrEqual(1056)
      expect(Math.abs(pageBox.x - ((viewport.width - pageBox.width) / 2))).toBeLessThanOrEqual(1)
    }

    for (const legacyPath of ['/settings', '/about']) {
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
    await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Salmos? 27/, exact: true })).toHaveCount(0)
    const fearSituation = page.getByRole('link', { name: /Tengo miedo.*Lectura central: Salmo 27/i })
    await fearSituation.click()
    await expect(page).toHaveURL(/\/topics\/temor-ansiedad-y-paz\/tengo-miedo$/)
    await expect(page.getByRole('heading', { name: /Salmos? 27/, exact: true })).toBeVisible()
    const centralReading = page.getByRole('link', { name: /Leer en el lector|Read in reader|Ler no leitor/ }).first()
    await expect(centralReading).toHaveAttribute('href', '/read/19/27')
    await centralReading.click()

    const backToGuide = page.getByRole('button', { name: /Volver a la guía|Back to the guide|Voltar ao guia/ })
    await expect(page).toHaveURL(/\/read\/19\/27$/)
    await expect(backToGuide).toBeVisible()
    await expect(backToGuide).toHaveText(/^(Volver a la guía|Back to the guide|Voltar ao guia)$/)
    await expect.poll(() => backToGuide.evaluate((button) => getComputedStyle(button.parentElement).position)).toBe('fixed')
    await page.evaluate(() => window.scrollTo(0, 700))
    await expect(backToGuide).toBeInViewport()
    await backToGuide.click()

    await expect(page).toHaveURL(/\/topics\/temor-ansiedad-y-paz\/tengo-miedo$/)
    await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeInViewport()
    await expect(page.getByRole('heading', { name: /Salmos? 27/, exact: true })).toBeVisible()
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
