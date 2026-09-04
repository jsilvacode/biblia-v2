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
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)

    await page.locator('.mobile-navigation').getByRole('link', { name: /Biblia|Bible/ }).click()
    await expect(page).toHaveURL(/\/bible$/)
    await page.goBack()

    await expect(page).toHaveURL(/\/$/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
  })

  test('reveals a selected book chapter picker in place', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only browser coverage')
    await page.goto('/bible')

    const selectedBook = page.locator('.book-list__item').filter({ hasText: /Apocalipsis|Revelation|Apocalipse/ })
    await selectedBook.click()

    const chapterPicker = page.locator('.chapter-picker--inline')
    await expect(selectedBook).toHaveAttribute('aria-expanded', 'true')
    await expect(chapterPicker).toBeVisible()
    await expect(chapterPicker).toBeInViewport()
    await expect(chapterPicker).toBeFocused()
    await expect(chapterPicker.getByRole('link', { name: '1', exact: true })).toBeInViewport()

    await selectedBook.click()
    await expect(page.locator('.chapter-picker--inline')).toHaveCount(0)
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
  test('keeps the Home hero full-bleed and separates the primary blocks', async ({ page }, testInfo) => {
    await page.goto('/')

    const heroBox = await page.getByRole('region', { name: /Promesa del día|Promise of the day|Promessa do dia/ }).boundingBox()
    const homeHeaderBox = await page.locator('header[class*="homeHeader"]').boundingBox()
    const heroRegion = page.getByRole('region', { name: /Promesa del día|Promise of the day|Promessa do dia/ })
    const heroKickerBox = await heroRegion.getByText(/Una promesa para hoy|A promise for today|Uma promessa para hoje/).boundingBox()
    const heroHeadingBox = await heroRegion.getByRole('heading').boundingBox()
    const readingBox = await page.locator('[class*="readingCard"]').boundingBox()
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
    expect(heroBox.height).toBeGreaterThanOrEqual(testInfo.project.name === 'desktop' ? 360 : 280)
    // The primary reading card deliberately overlaps the quiet lower edge of
    // the hero, but must remain a restrained transition rather than cover it.
    expect(readingBox.y - (heroBox.y + heroBox.height)).toBeGreaterThanOrEqual(-40)
  })

  test('keeps the Home and section headers at the same height', async ({ page }, testInfo) => {
    await page.goto('/')
    const homeHeader = await page.locator('header[class*="homeHeader"]').boundingBox()

    await page.goto('/bible')
    const sectionHeader = await page.locator('header[class*="homeHeader"]').boundingBox()

    expect(homeHeader).not.toBeNull()
    expect(sectionHeader).not.toBeNull()
    expect(Math.abs(homeHeader.height - sectionHeader.height)).toBeLessThanOrEqual(1)
    expect(homeHeader.height).toBeGreaterThanOrEqual(testInfo.project.name === 'desktop' ? 70 : 64)
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

  test('opens the daily plan and the thematic reading library from Home', async ({ page }) => {
    await page.goto('/')

    const dailyCard = page.getByRole('link', { name: /Reavivados por su Palabra|Revived by His Word|Reavivados por Sua Palavra/ })
    await expect(dailyCard).toBeVisible()
    await expect(dailyCard).toHaveAttribute('href', /\/read\/\d+\/\d+$/)

    const thematicCard = page.getByRole('link', { name: /Promesas de Dios|Promises of God|Promessas de Deus/ }).last()
    await expect(thematicCard.getByText(/Qué leer cuando|What to read when|O que ler quando/)).toBeVisible()
    await expect(thematicCard.getByText(/Guía de consulta bíblica|Bible reference guide|Guia de consulta bíblica/i)).toBeVisible()
    await thematicCard.click()
    await expect(page).toHaveURL(/\/topics$/)
    await expect(page.getByRole('heading', { name: /Qué leer cuando|What to read when|O que ler quando/i })).toBeVisible()
    await page.getByRole('button', { name: /Temor, ansiedad y paz/ }).click()
    await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Salmos? 27/, exact: true })).toHaveCount(0)
    const fearSituation = page.locator('summary', { has: page.getByRole('heading', { name: 'Tengo miedo', exact: true }) })
    await fearSituation.click()
    await expect(page.getByRole('heading', { name: /Salmos? 27/, exact: true })).toBeVisible()
    await fearSituation.click()
    await expect(page.getByRole('heading', { name: /Salmos? 27/, exact: true })).toHaveCount(0)
    await fearSituation.click()
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

    await expect(page).toHaveURL(/\/topics\?category=temor-ansiedad-y-paz#topic-temor-ansiedad-y-paz-tengo-miedo$/)
    await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeInViewport()
    await expect(page.locator('#topic-temor-ansiedad-y-paz-tengo-miedo')).toHaveAttribute('open', '')
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
