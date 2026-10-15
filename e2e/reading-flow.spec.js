import { expect, test } from '@playwright/test'

function passagePicker(page) {
  const form = page.getByTestId('reader-passage-picker')
  return { form, book: form.locator('[data-picker-trigger="book"]') }
}

async function expectNeutralPassagePicker(page) {
  const picker = passagePicker(page)
  await expect(picker.book).toHaveText(/^(Seleccionar libro|Select a book|Selecionar livro)$/)
  await expect(picker.book).toHaveAttribute('aria-expanded', 'false')
  await expect(picker.form.getByRole('button')).toHaveCount(1)
}

async function expectContainedReaderList(page) {
  const list = passagePicker(page).form.getByRole('dialog')
  await expect(list).toBeVisible()
  const box = await list.boundingBox()
  const viewport = page.viewportSize()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  expect(box.height).toBeLessThanOrEqual(325)
  return box
}

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
  await expect(page.getByRole('heading', { name: /^(Juan|John|João)$/ })).toBeVisible()
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
  expect(captured.text).toMatch(/\/read\/43\/3\/16\?v=[a-z0-9-]+&share=12$/)
  expect(captured).not.toHaveProperty('url')
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

test('the commentary modal keeps its title clear at maximum text size on narrow screens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Narrow-screen commentary coverage')
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/read/43/3/16')

  await page.getByRole('button', { name: /Abrir menú de lectura|Open reading menu|Abrir menu de leitura/ }).click()
  const quickOptions = page.getByRole('dialog', { name: /Opciones rápidas|Quick options|Opções rápidas/ })
  const increaseText = quickOptions.getByRole('button', { name: /Aumentar texto|Increase text|Aumentar texto/ })
  for (let index = 0; index < 6; index += 1) await increaseText.click()
  await expect(quickOptions.getByText('130%', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.locator('#verse-16').click()
  const actions = page.getByRole('dialog', { name: /Acciones del versículo|Verse actions|Ações do versículo/ })
  await actions.getByRole('button', { name: /Ver comentario bíblico|View Bible commentary|Ver comentário bíblico/ }).click()

  const commentary = page.getByRole('dialog', { name: /Comentario bíblico|Bible commentary|Comentário bíblico/ })
  const layout = await commentary.evaluate((element) => ({
    title: element.querySelector('.reader-dialog__header h2').getBoundingClientRect().toJSON(),
    reference: element.querySelector('.reader-dialog__reference').getBoundingClientRect().toJSON(),
  }))
  const commentaryFontSize = await commentary.locator('.reader-dialog__scroll-area').evaluate((element) => getComputedStyle(element).fontSize)

  expect(layout.title.bottom).toBeLessThanOrEqual(layout.reference.top)
  expect(commentaryFontSize).toBe('21.12px')
})


test('a reader can highlight a verse and choose another passage from the inline picker', async ({ page }) => {
  await page.goto('/read/43/3/16')
  const verse = page.locator('#verse-16')
  await verse.click()
  const actions = page.getByRole('dialog', { name: /Acciones del versículo|Verse actions|Ações do versículo/ })
  await actions.getByRole('button', { name: /Destacar versículo|Highlight verse|Destacar versículo/ }).click()
  await expect(actions).toBeHidden()
  await expect(verse).toHaveClass(/is-highlighted/)
  await expect(verse).not.toHaveClass(/is-selected/)

  const picker = passagePicker(page)
  await expectNeutralPassagePicker(page)
  await picker.book.click()
  await picker.form.locator('[data-book-id="1"]').click()
  await picker.form.locator('[data-chapter="1"]').click()
  await expect(page).toHaveURL(/\/read\/1\/1$/)
  await expect(page.getByRole('heading', { name: /^(Génesis|Genesis|Gênesis)$/, exact: true })).toBeVisible()
  await expectNeutralPassagePicker(page)

  await page.goto('/saved')
  await page.getByRole('tab', { name: /Resaltados|Highlights|Destaques/ }).click()
  await expect(page.locator('.saved-list').getByRole('link', { name: /Juan 3:16|John 3:16|João 3:16/ })).toBeVisible()
})


test('the inline reader picker is bounded, keyboard accessible and separate from reading options', async ({ page }) => {
  await page.goto('/read/43/3/16')
  const picker = passagePicker(page)
  await expectNeutralPassagePicker(page)
  await picker.book.click()
  await expectContainedReaderList(page)
  await expect(page.locator('.reader-dialog-backdrop')).toHaveCount(0)
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed')
  await page.keyboard.press('Escape')
  await expect(picker.form.getByRole('dialog')).toHaveCount(0)
  await expect(picker.book).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(picker.form.locator('[data-book-id="66"]')).toHaveAttribute('aria-expanded', 'true')
  await picker.form.locator('[data-chapter="1"]').focus()
  await page.keyboard.press('End')
  await expect(picker.form.locator('[data-chapter="22"]')).toBeFocused()
  await expectContainedReaderList(page)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/read\/66\/22$/)
  await expectNeutralPassagePicker(page)
  await picker.book.click()
  await page.getByRole('button', { name: /Abrir menú de lectura|Open reading menu|Abrir menu de leitura/ }).click()
  await expect(picker.form.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: /Opciones rápidas|Quick options|Opções rápidas/ })).toBeVisible()
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
  await expect(page.getByRole('heading', { name: /^(Juan|John|João)$/ })).toBeVisible()
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

test('the compact reader keeps its bottom navigation visible at the end of the chapter', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Automatic immersion is reserved for touch surfaces')
  await page.goto('/read/43/3')
  const reader = page.locator('.reader-page')
  const bottomNavigation = page.locator('.reader-bottom-navigation')

  await expect(page.locator('.verse').last()).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)).toBe(true)
  await expect(reader).not.toHaveClass(/reader-page--immersive/)
  await page.waitForTimeout(3400)
  await expect(reader).not.toHaveClass(/reader-page--immersive/)
  await expect(bottomNavigation).toHaveCSS('visibility', 'visible')
})


test('desktop readers separate the shared navigation bar from the compact passage row', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop-only reader navigation coverage')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/read/43/3')
  const header = page.locator('.reader-header')
  const navigation = page.locator('.reader-header__desktop-navigation')
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole('link')).toHaveCount(4)
  for (const [name, href] of [[/Inicio|Home|Início/, '/'], [/Biblia|Bible|Bíblia/, '/bible'], [/Buscar|Search/, '/search'], [/Guardados|Saved|Salvos/, '/saved']]) {
    const link = navigation.getByRole('link', { name })
    await expect(link).toHaveAttribute('href', href)
    await expect(link).toContainText(name)
    await expect(link.locator('svg')).toHaveCount(1)
  }
  const row = page.getByTestId('reader-passage-row')
  const back = row.getByRole('button', { name: /^(Volver|Back|Voltar)$/ })
  const brand = header.getByRole('link', { name: 'Santa Biblia', exact: true })
  const theme = header.getByRole('button', { name: /Activar (?:modo|tema) (?:claro|oscuro)|Use (?:light|dark) theme/i })
  const options = header.getByRole('button', { name: /Abrir menú de lectura|Open reading menu|Abrir menu de leitura/ })
  const [backBox, brandBox, navigationBox, themeBox, optionsBox, rowBox, barBox] = await Promise.all([
    back.boundingBox(), brand.boundingBox(), navigation.boundingBox(), theme.boundingBox(), options.boundingBox(),
    row.boundingBox(), page.locator('.reader-header__bar').boundingBox(),
  ])
  expect([backBox, brandBox, navigationBox, themeBox, optionsBox, rowBox, barBox].every(Boolean)).toBe(true)
  expect(backBox.y).toBeGreaterThanOrEqual(barBox.y + barBox.height)
  expect(brandBox.x + brandBox.width).toBeLessThanOrEqual(navigationBox.x)
  expect(Math.abs(navigationBox.x + navigationBox.width / 2 - 720)).toBeLessThanOrEqual(2)
  expect(themeBox.x).toBeGreaterThanOrEqual(navigationBox.x + navigationBox.width)
  expect(optionsBox.x).toBeGreaterThanOrEqual(themeBox.x + themeBox.width)
  const picker = passagePicker(page)
  const [bookBox, searchBox] = await Promise.all([picker.book.boundingBox(), row.getByRole('search').boundingBox()])
  expect(backBox.y + backBox.height).toBeLessThanOrEqual(bookBox.y)
  expect(bookBox.x + bookBox.width).toBeLessThanOrEqual(searchBox.x)
  expect(Math.abs(bookBox.y - searchBox.y)).toBeLessThanOrEqual(1)
  await expect(options.locator('svg.lucide-settings-2')).toHaveCount(1)
  await options.click()
  await expect(page.getByRole('dialog', { name: /Opciones rápidas|Quick options|Opções rápidas/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await navigation.getByRole('link', { name: /Inicio|Home|Início/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('the reference parser accepts English and Portuguese names', async ({ page }) => {
  await page.goto('/search')
  const searchbox = page.getByRole('searchbox')
  expect(await searchbox.getAttribute('placeholder')).toBeNull()
  await expect(page.getByText('Prueba con palabras, frases o citas', { exact: true })).toBeVisible()
  await expect(page.getByText('Ej: justificados por fe - Salmos 33 - 1 Corintios 3:18', { exact: true })).toBeVisible()

  await searchbox.fill('John 3:16')
  await expect(page.getByRole('link', { name: /Juan 3:16/ })).toBeVisible()

  await searchbox.fill('João 3:16')
  await expect(page.getByRole('link', { name: /Juan 3:16/ })).toBeVisible()
})

test('text search updates while the query is being typed', async ({ page }) => {
  await page.goto('/search')
  await page.getByRole('searchbox').fill('Nicodemo')

  await expect(page).toHaveURL(/\/search\?q=Nicodemo$/)
  await expect(page.getByRole('link', { name: /Juan 3:1/ })).toBeVisible()
})

test('search results expose the full total and load more than one hundred verses', async ({ page }) => {
  await page.goto('/search')
  await page.getByRole('searchbox').fill('mundo')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()

  const resultCount = page.locator('.search-results .result-count')
  const loadMore = page.getByRole('button', { name: /Ver más resultados|Show more results|Ver mais resultados/ })
  await expect(resultCount).toHaveText(/50 de [1-9]\d{2} resultados/)
  await expect(page.getByRole('link', { name: /Levítico 5:2/ })).toHaveCount(0)
  await expect(loadMore).toBeVisible()

  await loadMore.click()
  await expect(resultCount).toHaveText(/100 de [1-9]\d{2} resultados/)
  await loadMore.click()
  await expect(resultCount).toHaveText(/150 de [1-9]\d{2} resultados/)
  await expect(page.locator('.search-results .search-result')).toHaveCount(150)
})

test('changing or clearing a search does not leave stale results on the page', async ({ page }) => {
  await page.goto('/search')
  const input = page.getByRole('searchbox', { name: /Buscar en la Biblia|Search the Bible|Buscar na Bíblia/ })
  await input.fill('Nicodemo')
  await page.getByRole('button', { name: /Buscar|Search/ }).click()
  await expect(page.getByRole('link', { name: /Juan 3:1/ })).toBeVisible()

  await input.fill('mundo')
  await expect(page).toHaveURL(/\/search\?q=mundo$/)
  await expect(page.getByRole('link', { name: /Juan 3:1/ })).toHaveCount(0)

  await input.fill('')
  await expect(page).toHaveURL(/\/search$/)
  await expect(page.getByRole('link', { name: /Juan 3:1/ })).toHaveCount(0)
  await expect(page.locator('.search-results')).toHaveCount(0)
})

test('the compact reader book list contains both testaments without leaving the mobile screen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only reader dropdown coverage')
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/read/43/3')
  const picker = passagePicker(page)
  await expectNeutralPassagePicker(page)
  await picker.book.click()
  await expectContainedReaderList(page)
  const list = picker.form.getByRole('dialog')
  await expect(list.locator('[data-book-id]')).toHaveCount(66)
  await expect(list.getByRole('region', { name: /Antiguo Testamento|Old Testament|Antigo Testamento/ })).toHaveCount(1)
  await expect(list.getByRole('region', { name: /Nuevo Testamento|New Testament|Novo Testamento/ })).toHaveCount(1)
  await expect(list.locator('[data-book-id][aria-expanded="true"]')).toHaveCount(0)
  await list.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect(list.locator('[data-book-id="66"]')).toBeInViewport()
  await picker.book.press('Escape')
  await expect(page).toHaveURL(/\/read\/43\/3$/)
})


test('the Bible catalogue finds verses containing every searched word', async ({ page }) => {
  await page.goto('/bible')
  const catalogue = page.locator('main')
  const searchbox = catalogue.getByRole('searchbox', { name: /palabra, frase, libro o referencia|word, phrase, book, or reference|palavra, frase, livro ou referência/i })
  await searchbox.fill('tal manera mundo')
  await expect(catalogue.getByText('1 de 1 resultados', { exact: true })).toBeVisible()
  await expect(catalogue.getByRole('link', { name: /Marcos 1:27/ })).toHaveCount(0)
  const result = catalogue.getByRole('link', { name: /Juan 3:16.*Porque de tal manera amó Dios al mundo/i })
  await expect(result).toBeVisible()
  await result.click()
  await expect(page).toHaveURL(/\/read\/43\/3\/16$/)
  await expect(page.locator('#verse-16')).toBeVisible()
  await expect(page.locator('#verse-16')).toHaveClass(/is-attention-pulsing/)
})


test('the Bible catalogue shares the paginated text search contract', async ({ page }) => {
  await page.goto('/bible')
  const catalogue = page.locator('main')
  await catalogue.getByRole('searchbox', { name: /palabra, frase, libro o referencia|word, phrase, book, or reference|palavra, frase, livro ou referência/i }).fill('mundo')
  await expect(catalogue.getByText(/50 de [1-9]\d{2} resultados/, { exact: true })).toBeVisible()
  const loadMore = catalogue.getByRole('button', { name: /Ver más resultados|Show more results|Ver mais resultados/ })
  await expect(loadMore).toBeVisible()
  await loadMore.click()
  await expect(catalogue.getByText(/100 de [1-9]\d{2} resultados/, { exact: true })).toBeVisible()
})

test('saved surfaces only expose completed saved-verse features', async ({ page }) => {
  await page.goto('/saved')
  await expect(page.getByRole('tab')).toHaveCount(2)
})

for (const reducedMotion of ['reduce', 'no-preference']) {
  test(`chapter start returns to the heading without changing the shared passage (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/read/46/15/57?v=rva2015')
    await expect(page.locator('#verse-58')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    // Finish the initial shared-verse scroll before testing the chapter pager.
    await expect.poll(() => page.locator('#verse-57').evaluate(el => {
      const rect = el.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= innerHeight
    })).toBe(true)
    const pager = page.locator('.chapter-pager')
    const start = pager.getByRole('button', { name: /Ir al inicio del capítulo|Go to the start of the chapter|Ir ao início do capítulo/ })
    await start.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500)
    const before = await page.evaluate(() => ({ url: location.href, historyLength: history.length }))
    await start.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await expect(page.locator('.reader-content h1')).toBeFocused()
    expect(await page.evaluate(() => ({ url: location.href, historyLength: history.length }))).toEqual(before)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('santa_biblia_v2_settings')).bibleVersion)).toBe('rva2015')
    await pager.getByRole('button', { name: /Siguiente:|Next:|Próximo:/ }).click()
    await expect(page).toHaveURL(/\/read\/46\/16$/)
    await expect(page.locator('#verse-1')).toBeVisible()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
    await pager.getByRole('button', { name: /Anterior:|Previous:/ }).click()
    await expect(page).toHaveURL(/\/read\/46\/15$/)
    await expect(page.locator('#verse-1')).toBeVisible()
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
  })
}
