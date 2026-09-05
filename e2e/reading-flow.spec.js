import { expect, test } from '@playwright/test'

test('a shared verse URL opens the exact Bible version encoded in the link', async ({ page }) => {
  await page.goto('/read/43/3/16?v=rva2015')

  await expect(page).toHaveURL(/\?v=rva2015$/)
  await expect.poll(() => page.evaluate(() => {
    const stored = window.localStorage.getItem('santa_biblia_v2_settings')
    return stored ? JSON.parse(stored).bibleVersion : null
  })).toBe('rva2015')
  await expect(page.locator('#verse-16')).toContainText('ha dado a su Hijo unigénito')
})

test('a reader can open and save a verse', async ({ page }) => {
  await page.goto('/read/43/3/16')
  await expect(page.locator('#verse-16')).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('region', { name: /Promesa del día|Promise of the day|Promessa do dia/ }).getByRole('heading')).toBeVisible()

  await page.getByRole('link', { name: /Continuar|Continue/ }).click()
  await expect(page.getByRole('heading', { name: /Juan 3|John 3|João 3/ })).toBeVisible()
  await expect(page.getByText(/Nicodemo/).first()).toBeVisible()

  await page.getByRole('button', { name: /Porque de tal manera amó Dios al mundo/ }).click()
  const actions = page.getByRole('dialog', { name: /Acciones del versículo|Verse actions|Ações do versículo/ })
  await expect(actions).toBeVisible()
  await actions.getByRole('button', { name: /Guardar versículo|Save verse|Salvar versículo/ }).click()
  await expect(actions).toBeHidden()

  await page.goto('/saved')
  await expect(page.locator('.saved-list').getByRole('link', { name: /Juan 3:16|John 3:16|João 3:16/ })).toBeVisible()
})

test('sharing a verse action sends one detectable URL for its social card', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (payload) => window.sessionStorage.setItem('captured-verse-share', JSON.stringify(payload)),
    })
  })
  await page.goto('/read/43/3/16')

  await page.locator('#verse-16').click()
  const actions = page.getByRole('dialog', { name: /Acciones del versículo|Verse actions|Ações do versículo/ })
  await actions.getByRole('button', { name: /Compartir versículo|Share verse|Compartilhar versículo/ }).click()

  await expect.poll(async () => page.evaluate(() => {
    const value = window.sessionStorage.getItem('captured-verse-share')
    return value ? JSON.parse(value) : null
  })).not.toBeNull()
  const captured = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('captured-verse-share')))
  expect(captured.url).toMatch(/\/read\/43\/3\/16\?v=[a-z0-9-]+&share=7$/)
  expect(captured).not.toHaveProperty('text')
})

test('the verse action sheet closes safely and exposes commentary', async ({ page }) => {
  await page.goto('/read/43/3/16')
  const verse = page.locator('#verse-16')
  await expect(verse).toBeVisible()

  await verse.click()
  const actions = page.getByRole('dialog', { name: /Acciones del versículo|Verse actions|Ações do versículo/ })
  await expect(actions).toBeVisible()
  await expect(verse).toHaveClass(/is-selected/)
  await expect(verse).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(actions).toBeHidden()
  await expect(verse).not.toBeFocused()
  await expect(verse).not.toHaveClass(/is-selected/)
  await expect(verse).toHaveAttribute('aria-pressed', 'false')

  await verse.focus()
  await page.keyboard.press('Enter')
  await expect(actions).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(actions).toBeHidden()
  await expect(verse).toBeFocused()

  await verse.click()
  await expect(verse).toHaveClass(/is-selected/)
  await page.locator('.reader-dialog-backdrop').click({ position: { x: 5, y: 5 } })
  await expect(actions).toBeHidden()
  await expect(verse).not.toHaveClass(/is-selected/)
  await expect(verse).toHaveAttribute('aria-pressed', 'false')

  await verse.click()
  await actions.getByRole('button', { name: /Ver comentario bíblico|View Bible commentary|Ver comentário bíblico/ }).click()
  const commentary = page.getByRole('dialog', { name: /Comentario bíblico|Bible commentary|Comentário bíblico/ })
  await expect(commentary).toBeVisible()
  await expect(verse).not.toHaveClass(/is-selected/)
  await expect(verse).toHaveAttribute('aria-pressed', 'false')
  await expect(commentary.getByRole('button', { name: /Volver|Back|Voltar/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(commentary).toBeHidden()
})

test('a reader can highlight a verse and use the quick chapter picker', async ({ page }) => {
  await page.goto('/read/43/3/16')
  const verse = page.locator('#verse-16')
  await verse.click()
  const actions = page.getByRole('dialog', { name: /Acciones del versículo|Verse actions|Ações do versículo/ })
  await actions.getByRole('button', { name: /Destacar versículo|Highlight verse|Destacar versículo/ }).click()
  await expect(actions).toBeHidden()
  await expect(verse).toHaveClass(/is-highlighted/)
  await expect(verse).not.toHaveClass(/is-selected/)

  await page.getByRole('button', { name: /Juan 3|John 3|João 3/ }).click()
  const navigation = page.getByRole('dialog', { name: /Ir a|Go to|Ir para/ })
  await expect(navigation).toBeVisible()
  await navigation.getByRole('button', { name: /Génesis|Genesis|Gênesis/ }).click()
  await navigation.getByRole('button', { name: '1', exact: true }).click()
  await expect(page).toHaveURL(/\/read\/1\/1$/)

  await page.goto('/saved')
  await page.getByRole('tab', { name: /Resaltados|Highlights|Destaques/ }).click()
  await expect(page.locator('.saved-list').getByRole('link', { name: /Juan 3:16|John 3:16|João 3:16/ })).toBeVisible()
})

test('the quick chapter picker uses the responsive reader surface', async ({ page }) => {
  await page.goto('/read/43/3/16')
  const trigger = page.getByRole('button', { name: /Juan 3|John 3|João 3/ })
  await trigger.click()

  const navigation = page.getByRole('dialog', { name: /Ir a|Go to|Ir para/ })
  await expect(navigation).toBeVisible()
  await expect(page.locator('.reader-dialog-backdrop')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed')
  const triggerBox = await trigger.boundingBox()
  const navigationBox = await navigation.boundingBox()
  expect(triggerBox).not.toBeNull()
  expect(navigationBox).not.toBeNull()
  expect(navigationBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height)
  await page.keyboard.press('Escape')

  await expect(navigation).toBeHidden()
  await expect(trigger).not.toBeFocused()

  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(navigation).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(navigation).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('a deep-linked verse is brought into the reading viewport', async ({ page }) => {
  await page.goto('/read/43/3/16')
  await expect(page.locator('#verse-16')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})

test('a verse opened from search receives a temporary attention pulse', async ({ page }) => {
  await page.goto('/search')
  await page.getByRole('searchbox').fill('Nicodemo')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()

  await page.getByRole('link', { name: /Juan 3:1/ }).click()
  await expect(page).toHaveURL(/\/read\/43\/3\/1$/)

  const verse = page.locator('#verse-1')
  await expect(verse).toBeVisible()
  await expect(verse).toHaveClass(/is-attention-pulsing/)
  await expect(verse).not.toHaveClass(/is-attention-pulsing/, { timeout: 4000 })
  await expect(verse).not.toHaveClass(/is-selected/)
  await expect(verse).toHaveAttribute('aria-pressed', 'false')
})

test('a verse opened from saved bookmarks or highlights receives a temporary attention pulse', async ({ page }) => {
  await page.goto('/read/43/3/16')

  const verseSixteen = page.locator('#verse-16')
  await verseSixteen.click()
  const actions = page.getByRole('dialog', { name: /Acciones del versículo|Verse actions|Ações do versículo/ })
  await actions.getByRole('button', { name: /Guardar versículo|Save verse|Salvar versículo/ }).click()
  await expect(actions).toBeHidden()

  const verseOne = page.locator('#verse-1')
  await verseOne.click()
  await actions.getByRole('button', { name: /Destacar versículo|Highlight verse|Destacar versículo/ }).click()
  await expect(actions).toBeHidden()

  await page.goto('/saved')
  await page.locator('.saved-list').getByRole('link', { name: /Juan 3:16|John 3:16|João 3:16/ }).click()
  await expect(page).toHaveURL(/\/read\/43\/3\/16$/)
  await expect(verseSixteen).toBeVisible()
  await expect(verseSixteen).toHaveClass(/is-attention-pulsing/)
  await expect(verseSixteen).not.toHaveClass(/is-attention-pulsing/, { timeout: 4000 })
  await expect(verseSixteen).not.toHaveClass(/is-selected/)

  await page.goto('/saved')
  await page.getByRole('tab', { name: /Resaltados|Highlights|Destaques/ }).click()
  await page.locator('.saved-list').getByRole('link', { name: /Juan 3:1|John 3:1|João 3:1/ }).click()
  await expect(page).toHaveURL(/\/read\/43\/3\/1$/)
  await expect(verseOne).toBeVisible()
  await expect(verseOne).toHaveClass(/is-attention-pulsing/)
  await expect(verseOne).not.toHaveClass(/is-attention-pulsing/, { timeout: 4000 })
  await expect(verseOne).not.toHaveClass(/is-selected/)
})

test('reader back returns to in-app origin with a safe fallback', async ({ page }) => {
  await page.goto('/read/43/3')
  await expect(page.getByRole('heading', { name: /Juan 3|John 3|João 3/ })).toBeVisible()
  await expect.poll(() => page.evaluate(() => {
    const value = window.localStorage.getItem('santa_biblia_v2_reading')
    return value ? JSON.parse(value).updatedAt : null
  })).toBeGreaterThan(0)
  await page.goto('/')
  await page.getByRole('link', { name: /Continuar|Continue/ }).click()
  await expect(page).toHaveURL(/\/read\/43\/3/)
  await page.getByRole('button', { name: /Volver|Back|Voltar/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('reader contextual menu exposes theme, text size and all settings without restoring global chrome', async ({ page }) => {
  await page.goto('/read/43/3/16')
  const trigger = page.getByRole('button', { name: /Abrir menú de lectura|Open reading menu|Abrir menu de leitura/ })
  await trigger.click()

  const sections = page.getByRole('dialog', { name: /Opciones rápidas|Quick options|Opções rápidas/ })
  await expect(sections).toBeVisible()
  await expect(sections.getByRole('link')).toHaveCount(0)
  await expect(sections.getByRole('button', { name: /Activar (?:modo|tema) (?:claro|oscuro)|Use (?:light|dark) theme/i })).toBeFocused()
  await expect(sections.getByRole('button', { name: /Español|English|Português/, exact: true })).toHaveCount(0)
  await expect(sections.getByRole('group', { name: /Tamaño del texto|Text size|Tamanho do texto/ })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(sections).toBeHidden()
  await expect(trigger).not.toBeFocused()

  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(sections).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sections).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await sections.getByRole('button', { name: /Todos los ajustes|All settings|Todos os ajustes/ }).click()
  const settings = page.getByRole('dialog', { name: /Ajustes|Settings|Configurações/ })
  await expect(settings).toBeVisible()
  await expect(settings.getByRole('combobox', { name: /Idioma de la interfaz|Interface language|Idioma da interface/ })).toBeVisible()
  await expect(settings).toHaveClass(/reader-dialog--popover/)
  await expect(page).toHaveURL(/\/read\/43\/3\/16$/)
  await expect(page.locator('.site-header')).toHaveCount(0)
  await expect(page.locator('.reader-header')).toBeVisible()
})

test('the compact reader hides only its bottom navigation and restores it on scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Automatic immersion is reserved for touch surfaces')
  await page.goto('/read/43/3')
  const reader = page.locator('.reader-page')
  const header = page.locator('.reader-header')
  const progress = page.locator('.reading-progress')
  const bottomNavigation = page.locator('.reader-bottom-navigation')

  await expect(reader).not.toHaveClass(/reader-page--immersive/)
  await expect(reader).toHaveClass(/reader-page--immersive/, { timeout: 4500 })
  const hideTransition = await bottomNavigation.evaluate((element) => getComputedStyle(element).transition)
  expect(hideTransition).toContain('0.56s')
  await expect(header).toHaveCSS('visibility', 'visible')
  await expect(progress).toHaveCSS('visibility', 'visible')
  await expect(bottomNavigation).toHaveCSS('visibility', 'hidden')

  await page.evaluate(() => window.scrollBy(0, 160))
  await expect(reader).not.toHaveClass(/reader-page--immersive/)
  await expect(header).toHaveCSS('visibility', 'visible')
  await expect(bottomNavigation).toHaveCSS('visibility', 'visible')
  await page.waitForTimeout(120)
  const midRevealOpacity = Number(await bottomNavigation.evaluate((element) => getComputedStyle(element).opacity))
  expect(midRevealOpacity).toBeGreaterThan(0.08)
  expect(midRevealOpacity).toBeLessThan(0.8)
  await expect(bottomNavigation).toHaveCSS('opacity', '1')
})

test('desktop readers expose icon-only primary navigation in the constrained header', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop-only reader navigation coverage')
  await page.goto('/read/43/3')
  await page.waitForTimeout(4200)

  const navigation = page.locator('.reader-header__desktop-navigation')
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole('link')).toHaveCount(4)
  const home = navigation.getByRole('link', { name: /Inicio|Home|Início/ })
  await expect(home).toHaveAttribute('href', '/')
  await expect(navigation.getByRole('link', { name: /Biblia|Bible|Bíblia/ })).toHaveAttribute('href', '/bible')
  await expect(navigation.getByRole('link', { name: /Buscar|Search/ })).toHaveAttribute('href', '/search')
  await expect(navigation.getByRole('link', { name: /Guardados|Saved|Salvos/ })).toHaveAttribute('href', '/saved')

  const headerBox = await page.locator('.reader-header__inner').boundingBox()
  expect(headerBox).not.toBeNull()
  expect(headerBox.width).toBeLessThanOrEqual(1056)
  expect(Math.abs(headerBox.x - ((page.viewportSize().width - headerBox.width) / 2))).toBeLessThanOrEqual(1)
  const chapterSelector = page.getByRole('button', { name: /Juan 3|John 3|João 3/ })
  await chapterSelector.click()
  const chapterDialog = page.getByRole('dialog', { name: /Ir a|Go to|Ir para/ })
  await expect(chapterDialog).toBeVisible()
  await chapterDialog.getByRole('button', { name: /Volver|Back|Voltar/ }).click()

  await page.getByRole('button', { name: /Abrir menú de lectura|Open reading menu|Abrir menu de leitura/ }).click()
  await expect(page.getByRole('dialog', { name: /Opciones rápidas|Quick options|Opções rápidas/ })).toBeVisible()
  await page.keyboard.press('Escape')

  await home.click()
  await expect(page).toHaveURL(/\/$/)
})

test('the reference parser accepts English and Portuguese names', async ({ page }) => {
  await page.goto('/search')
  const searchbox = page.getByRole('searchbox')
  expect(await searchbox.getAttribute('placeholder')).toBeNull()
  await expect(page.getByText('Prueba con palabras, frases o citas', { exact: true })).toBeVisible()
  await expect(page.getByText('Ej: justificados por fe - Salmos 33 - 1 Corintios 3:18', { exact: true })).toBeVisible()

  await searchbox.fill('John 3:16')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()
  await expect(page.getByRole('link', { name: /Juan 3:16/ })).toBeVisible()

  await searchbox.fill('João 3:16')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()
  await expect(page.getByRole('link', { name: /Juan 3:16/ })).toBeVisible()
})

test('text search runs in the deferred worker', async ({ page }) => {
  await page.goto('/search')
  await page.getByRole('searchbox').fill('Nicodemo')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()

  await expect(page.getByRole('link', { name: /Juan 3:1/ })).toBeVisible()
})

test('clearing a search does not leave stale results on the page', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByRole('searchbox', { name: /Buscar en la Biblia|Search the Bible|Buscar na Bíblia/ })
  await input.fill('Nicodemo')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()
  await expect(page.getByRole('link', { name: /Juan 3:1/ })).toBeVisible()

  await input.fill('')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()
  await expect(page).toHaveURL(/\/search$/)
  await expect(page.getByRole('link', { name: /Juan 3:1/ })).toHaveCount(0)
})

test('the Bible browser starts clean and opens chapters only after a book is chosen', async ({ page }) => {
  await page.goto('/bible')
  await expect(page.locator('.book-list__item.is-selected')).toHaveCount(0)
  await expect(page.locator('.chapter-picker--inline')).toHaveCount(0)

  await page.getByRole('button', { name: /Antiguo Testamento|Old Testament|Antigo Testamento/ }).click()
  await expect(page.locator('.book-list__item.is-selected')).toHaveCount(0)

  await page.getByRole('button', { name: /Génesis|Genesis|Gênesis/ }).click()

  const chapterPicker = page.getByRole('region', { name: /Génesis|Genesis|Gênesis/ })
  await expect(chapterPicker).toBeVisible()
  await expect(chapterPicker.getByRole('link', { name: '1', exact: true })).toBeVisible()

  await page.getByRole('button', { name: /Nuevo Testamento|New Testament|Novo Testamento/ }).click()
  await page.getByRole('button', { name: /Antiguo Testamento|Old Testament|Antigo Testamento/ }).click()
  await expect(page.locator('.book-list__item.is-selected')).toHaveCount(0)
  await expect(page.locator('.chapter-picker--inline')).toHaveCount(0)
})

test('saved surfaces only expose completed saved-verse features', async ({ page }) => {
  await page.goto('/saved')
  await expect(page.getByRole('tab')).toHaveCount(2)
})
