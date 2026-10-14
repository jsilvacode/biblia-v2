import { expect, test } from '@playwright/test'

const continueLabel = /^Continuar(?:\b|:)/
const promiseTitle = /Promesa del día|Promise of the day|Promessa do dia/

async function prepareHomeState(page, { history = false, theme = 'light' } = {}) {
  await page.goto('/')
  await page.evaluate(({ nextHistory, nextTheme }) => {
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({
      bibleVersion: 'nbla', fontFamily: 'serif', locale: 'es',
      readerFontScale: 1, readerLineHeight: 'comfortable', theme: nextTheme,
    }))
    if (nextHistory) {
      window.localStorage.setItem('santa_biblia_v2_reading', JSON.stringify({
        book: 43, chapter: 3, verse: 16, progress: 42, updatedAt: 1_789_876_543_210,
      }))
    } else {
      window.localStorage.removeItem('santa_biblia_v2_reading')
    }
  }, { nextHistory: history, nextTheme: theme })
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
}

async function clearAppStorage(page) {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.clear()
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ locale: 'es', theme: 'light', bibleVersion: 'nbla' }))
  })
  await page.reload()
}

function homePicker(page) {
  const form = page.getByTestId('home-reading-actions')
  return {
    form,
    book: form.getByRole('combobox', { name: 'Libro', exact: true }),
    chapter: form.getByRole('combobox', { name: 'Capítulo', exact: true }),
    open: form.getByRole('button', { name: 'Abrir capítulo', exact: true }),
  }
}

async function expectNeutralPicker(page) {
  const picker = homePicker(page)
  await expect(picker.book).toHaveText('Seleccionar libro')
  await expect(picker.chapter).toHaveText('Capítulo')
  await expect(picker.chapter).toBeDisabled()
  await expect(picker.open).toBeDisabled()
}

async function selectOption(page, trigger, name) {
  await trigger.click()
  await page.getByRole('listbox').getByRole('option', { name, exact: true }).click()
  await expect(page.getByRole('listbox')).toHaveCount(0)
}

async function expectPopupWithinScreen(page) {
  const popup = page.getByRole('listbox')
  await expect(popup).toBeVisible()
  const box = await popup.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(box.height).toBeLessThanOrEqual(289)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  const navigation = page.locator('.mobile-navigation')
  if (await navigation.isVisible()) {
    const navigationBox = await navigation.boundingBox()
    expect(box.y + box.height).toBeLessThanOrEqual(navigationBox.y)
  }
  return box
}

function expectConnectedPopup(popupBox, triggerBox) {
  const direction = popupBox.y >= triggerBox.y + triggerBox.height ? 'down' : 'up'
  const gap = direction === 'down'
    ? popupBox.y - (triggerBox.y + triggerBox.height)
    : triggerBox.y - (popupBox.y + popupBox.height)
  // The popup and trigger share a border instead of floating apart.
  expect(Math.abs(gap)).toBeLessThanOrEqual(1)
  return direction
}

test('Home provides one editorial entry for each destination and the four original external links', async ({ page }) => {
  const startupImages = []
  page.on('request', (request) => { if (request.resourceType() === 'image') startupImages.push(request.url()) })
  await clearAppStorage(page)
  await expect(page.locator('#boot-splash')).toHaveCount(0)
  const hero = page.getByRole('region', { name: promiseTitle })
  await expect(hero.getByRole('heading')).toBeVisible()
  await expect(hero.getByRole('link', { name: /Leer capítulo/ })).toHaveAttribute('href', /^\/read\/\d+\/\d+\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Leer la Biblia', exact: true })).toBeVisible()
  expect(startupImages.some((url) => url.includes('/assets/social/verse-card-background.jpg'))).toBe(false)
  const picker = homePicker(page)
  for (const control of [picker.book, picker.chapter]) {
    await expect(control.locator('span').first()).toBeVisible()
    const label = await control.getAttribute('aria-labelledby')
    await expect(page.locator(`[id="${label}"]`)).toHaveClass('sr-only')
  }

  for (const [name, path] of [
    [/Reavivados por su Palabra/, '/reavivados'],
    [/Qué leer cuando/, '/topics'],
    [/La Fe de Jesús/, '/studies/la-fe-de-jesus'],
  ]) {
    const entry = page.getByRole('link', { name })
    await expect(entry).toHaveCount(1)
    await expect(entry).toBeVisible()
    await expect(entry).toHaveAttribute('href', path)
  }

  const editorialImages = page.getByRole('region', { name: 'También en Santa Biblia', exact: true }).locator('img')
  await expect(editorialImages).toHaveCount(3)
  for (const image of await editorialImages.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true)
    await image.evaluate((element) => element.decode())
  }

  const interestSection = page.getByRole('region', { name: 'Enlaces de interés · Sitios externos', exact: true })
  await expect(interestSection.locator('a[target="_blank"]')).toHaveCount(4)
  for (const [name, url] of [
    ['Escuela Sabática', 'https://escuelasabatica.cl/'],
    ['Diálogo Bíblico', 'https://www.youtube.com/playlist?list=PLn19CCwh0uJwsZM3-89oEGdorLikq9hFS'],
    ['Nuevo Tiempo', 'https://nuevotiempo.cl/'],
    ['ADRA', 'https://adra.cl/'],
  ]) {
    const link = interestSection.getByRole('link', { name: new RegExp(name) })
    await expect(link).toHaveAttribute('href', url)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await expect(link).toHaveAttribute('rel', /noreferrer/)
    const logo = link.locator('img')
    await expect(logo).toHaveCount(1)
    await logo.scrollIntoViewIfNeeded()
    await expect.poll(() => logo.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
})

test('the unavailable Christian library has no route until a redistributable edition is verified', async ({ page }) => {
  await page.goto('/library')
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText(/Lecturas para seguir creciendo|Readings to keep growing|Leituras para continuar crescendo/)).toHaveCount(0)
})

test('a new reader chooses a book and chapter explicitly before opening the reader', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await clearAppStorage(page)
  await expect(page.getByRole('link', { name: continueLabel })).toHaveCount(0)
  await expectNeutralPicker(page)
  const picker = homePicker(page)
  await selectOption(page, picker.book, 'Génesis')
  await expect(picker.chapter).toBeEnabled()
  await expect(picker.chapter).toHaveText('Capítulo')
  await expect(picker.open).toBeDisabled()
  await selectOption(page, picker.chapter, '1')
  await expect(picker.open).toBeEnabled()
  await picker.open.click()
  await expect(page).toHaveURL(/\/read\/1\/1$/)
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0)
})

test('returning Home keeps the picker neutral and offers the last reading as a separate link', async ({ page }) => {
  await clearAppStorage(page)
  const picker = homePicker(page)
  await selectOption(page, picker.book, 'Juan')
  await selectOption(page, picker.chapter, '3')
  await picker.open.click()
  await expect(page).toHaveURL(/\/read\/43\/3$/)
  await expect.poll(() => page.evaluate(() => {
    const value = window.localStorage.getItem('santa_biblia_v2_reading')
    return value ? JSON.parse(value).updatedAt : null
  })).toBeGreaterThan(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expectNeutralPicker(page)
  const panel = page.getByTestId('home-reading-panel')
  await expect(panel.getByText('Última lectura', { exact: true })).toBeVisible()
  await expect(panel.getByText(/^Juan 3(?::\d+)?$/, { exact: true })).toBeVisible()
  const continueReading = panel.getByRole('link', { name: continueLabel })
  await expect(continueReading).toHaveAttribute('href', /^\/read\/43\/3(?:\/\d+)?$/)
  await continueReading.click()
  await expect(page).toHaveURL(/\/read\/43\/3(?:\/\d+)?$/)
})

test('changing the book clears an incompatible chapter without changing the last reading', async ({ page }) => {
  await prepareHomeState(page, { history: true })
  const picker = homePicker(page)
  const continueReading = page.getByTestId('home-reading-panel').getByRole('link', { name: continueLabel })
  const previousHref = await continueReading.getAttribute('href')
  await selectOption(page, picker.book, 'Salmos')
  await selectOption(page, picker.chapter, '150')
  await expect(picker.open).toBeEnabled()
  await selectOption(page, picker.book, 'Judas')
  await expect(picker.chapter).toHaveText('Capítulo')
  await expect(picker.open).toBeDisabled()
  await picker.chapter.click()
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(1)
  await page.getByRole('option', { name: '1', exact: true }).click()
  await expect(picker.open).toBeEnabled()
  await expect(continueReading).toHaveAttribute('href', previousHref)
})

test('the centered Home picker remains readable without horizontal overflow in both themes', async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 768, height: 1024 }, { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport)
    for (const theme of ['light', 'dark']) {
      await prepareHomeState(page, { history: true, theme })
      const picker = homePicker(page)
      const panel = page.getByTestId('home-reading-panel')
      await picker.form.scrollIntoViewIfNeeded()
      await expectNeutralPicker(page)
      const [formBox, panelBox] = await Promise.all([picker.form.boundingBox(), panel.boundingBox()])
      expect(Math.abs((formBox.x + formBox.width / 2) - (panelBox.x + panelBox.width / 2))).toBeLessThanOrEqual(1)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      for (const control of [picker.book, picker.chapter, picker.open]) {
        await expect(control).toBeVisible()
        expect(await control.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      }
      await expect(panel.getByRole('link', { name: continueLabel })).toBeVisible()
    }
  }
})

test('book and chapter lists share a bounded height and open toward the available mobile space', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 })
  await clearAppStorage(page)
  const picker = homePicker(page)
  const directions = new Set()
  for (const triggerY of [110, 500]) {
    await picker.book.evaluate((element, y) => window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - y), triggerY)
    await picker.book.click()
    const bookBox = await expectPopupWithinScreen(page)
    const triggerBox = await picker.book.boundingBox()
    const direction = expectConnectedPopup(bookBox, triggerBox)
    directions.add(direction)
    await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(66)
    await page.getByRole('option', { name: 'Génesis', exact: true }).click()
    await picker.chapter.click()
    const chapterBox = await expectPopupWithinScreen(page)
    expectConnectedPopup(chapterBox, await picker.chapter.boundingBox())
    expect(Math.abs(chapterBox.height - bookBox.height)).toBeLessThanOrEqual(1)
    await picker.chapter.press('Escape')
    await expect(page.getByRole('listbox')).toHaveCount(0)
  }
  expect([...directions].sort()).toEqual(['down', 'up'])
})

test('keyboard navigation and enlarged text can open the last chapter of a book', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepareHomeState(page, { history: true })
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px' })
  const picker = homePicker(page)
  await picker.book.focus()
  await picker.book.press('ArrowDown')
  await picker.book.press('End')
  await picker.book.press('Enter')
  await expect(picker.book).toHaveText('Apocalipsis')
  await picker.chapter.focus()
  await picker.chapter.press('ArrowDown')
  await picker.chapter.press('End')
  await expectPopupWithinScreen(page)
  await picker.chapter.press('Enter')
  await expect(picker.chapter).toHaveText('22')
  await expect(picker.open).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await picker.open.click()
  await expect(page).toHaveURL(/\/read\/66\/22$/)
})

test('the daily promise opens its exact verse with a temporary attention pulse', async ({ page }) => {
  await clearAppStorage(page)
  const promiseReading = page.getByRole('region', { name: promiseTitle }).getByRole('link', { name: /Leer capítulo|Read chapter|Ler capítulo/ })
  await promiseReading.click()
  await expect(page).toHaveURL(/\/read\/\d+\/\d+\/\d+$/)
  const verse = page.locator('.verse.is-attention-pulsing')
  await expect(verse).toBeVisible()
  await expect(verse).toHaveCount(0, { timeout: 4000 })
})

test('sharing the promise sends one detectable URL for its social card', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (payload) => window.sessionStorage.setItem('captured-promise-share', JSON.stringify(payload)),
    })
  })
  await clearAppStorage(page)
  const hero = page.getByRole('region', { name: promiseTitle })
  const shareButton = hero.getByRole('button', { name: /Compartir promesa|Share promise|Compartilhar promessa/ })
  await expect(shareButton).toBeEnabled()
  await shareButton.click()
  await expect.poll(async () => page.evaluate(() => {
    const value = window.sessionStorage.getItem('captured-promise-share')
    return value ? JSON.parse(value) : null
  })).not.toBeNull()
  const payload = await page.evaluate(() => JSON.parse(window.sessionStorage.getItem('captured-promise-share')))
  expect(payload.text).toMatch(/\/read\/\d+\/\d+\/\d+\?v=[a-z0-9-]+(?:&end=\d+)?&share=12$/)
  expect(payload).not.toHaveProperty('url')
})
