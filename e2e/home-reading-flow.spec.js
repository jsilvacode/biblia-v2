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
    window.localStorage.removeItem('santa_biblia_v2_recent_readings')
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
  return { form, book: form.locator('[data-picker-trigger="book"]') }
}

async function waitForHomeLayout(page) {
  // Geometry assertions require the final quote and editorial font metrics,
  // rather than the shorter loading message and fallback font.
  await expect(page.getByRole('region', { name: promiseTitle })).toHaveAttribute('aria-busy', 'false')
  await page.evaluate(async () => { await document.fonts.ready })
}

async function expectNeutralPicker(page) {
  const picker = homePicker(page)
  await expect(picker.book).toHaveText('Seleccionar libro')
  await expect(picker.book).toHaveAttribute('aria-expanded', 'false')
  await expect(picker.form.getByRole('button')).toHaveCount(1)
}

async function chooseBook(page, bookId) {
  const picker = homePicker(page)
  if (await picker.book.getAttribute('aria-expanded') !== 'true') await picker.book.click()
  await picker.form.locator(`[data-book-id="${bookId}"]`).click()
}

async function expectPopupWithinScreen(page) {
  const popup = homePicker(page).form.getByRole('dialog')
  await expect(popup).toBeVisible()
  const box = await popup.boundingBox()
  const viewport = page.viewportSize()
  expect(box.height).toBeLessThanOrEqual(325)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  const navigation = page.locator('.mobile-navigation')
  if (await navigation.isVisible()) expect(box.y + box.height).toBeLessThanOrEqual((await navigation.boundingBox()).y)
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
  await expect(picker.book).toHaveAccessibleName('Seleccionar libro')
  await expect(picker.form.getByRole('button')).toHaveCount(1)

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

test('a new reader chooses a chapter inside its book and enters the reader directly', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await clearAppStorage(page)
  await expectNeutralPicker(page)
  await chooseBook(page, 1)
  const picker = homePicker(page)
  await expect(picker.form.locator('[data-chapter]')).toHaveCount(50)
  await picker.form.getByRole('button', { name: 'Abrir Génesis 1', exact: true }).click()
  await expect(page).toHaveURL(/\/read\/1\/1$/)
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0)
})

test('returning Home keeps the picker neutral and offers the last reading as a separate link', async ({ page }) => {
  await clearAppStorage(page)
  const picker = homePicker(page)
  await chooseBook(page, 43)
  await picker.form.locator('[data-chapter="3"]').click()
  await expect(page).toHaveURL(/\/read\/43\/3$/)
  await expect.poll(() => page.evaluate(() => {
    const value = window.localStorage.getItem('santa_biblia_v2_reading')
    return value ? JSON.parse(value).updatedAt : null
  })).toBeGreaterThan(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await expectNeutralPicker(page)
  const panel = page.getByTestId('home-reading-panel')
  await expect(panel.getByRole('heading', { name: page.viewportSize().width <= 620 ? 'Última lectura' : 'Lecturas recientes', exact: true })).toBeVisible()
  await expect(panel.getByText(/^Juan 3(?::\d+)?$/, { exact: true })).toBeVisible()
  const continueReading = panel.getByRole('link', { name: continueLabel })
  await expect(continueReading).toHaveAttribute('href', /^\/read\/43\/3(?:\/\d+)?$/)
  await continueReading.click()
  await expect(page).toHaveURL(/\/read\/43\/3(?:\/\d+)?$/)
})

test('changing and closing a book leaves reading history intact until a chapter is chosen', async ({ page }) => {
  await prepareHomeState(page, { history: true })
  const picker = homePicker(page)
  const recent = page.getByTestId('home-reading-panel').getByRole('link', { name: continueLabel })
  const previousHref = await recent.getAttribute('href')
  await chooseBook(page, 19)
  await expect(picker.form.locator('[data-chapter]')).toHaveCount(150)
  await chooseBook(page, 65)
  await expect(picker.form.locator('[data-chapter]')).toHaveCount(1)
  await picker.form.getByRole('button', { name: 'Cerrar: Judas' }).click()
  await expect(picker.form.locator('[data-chapter]')).toHaveCount(0)
  await expect(recent).toHaveAttribute('href', previousHref)
  await expect(page).toHaveURL(/\/$/)
  await picker.form.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await expectNeutralPicker(page)
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
      for (const control of [picker.book]) {
        await expect(control).toBeVisible()
        expect(await control.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
      }
      await expect(panel.getByRole('link', { name: continueLabel })).toBeVisible()
    }
  }
})

test('the book accordion opens toward available space and contains even all 150 Psalms', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 })
  await clearAppStorage(page)
  await waitForHomeLayout(page)
  const picker = homePicker(page)
  const directions = new Set()
  for (const triggerY of [110, 500]) {
    await picker.book.evaluate((element, y) => window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - y), triggerY)
    await picker.book.click()
    const box = await expectPopupWithinScreen(page)
    directions.add(expectConnectedPopup(box, await picker.book.boundingBox()))
    await expect(picker.form.locator('[data-book-id]')).toHaveCount(66)
    const psalms = picker.form.locator('[data-book-id="19"]')
    if (await psalms.getAttribute('aria-expanded') !== 'true') await psalms.click()
    await expect(picker.form.locator('[data-chapter]')).toHaveCount(150)
    await expectPopupWithinScreen(page)
    await picker.form.locator('[data-chapter="150"]').scrollIntoViewIfNeeded()
    await expect(picker.form.locator('[data-chapter="150"]')).toBeInViewport()
    await page.keyboard.press('Escape')
    await expect(picker.form.getByRole('dialog')).toHaveCount(0)
  }
  expect([...directions].sort()).toEqual(['down', 'up'])
})

test('keyboard navigation and enlarged text can open the last chapter of a book', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await prepareHomeState(page, { history: true })
  await waitForHomeLayout(page)
  await page.evaluate(() => { document.documentElement.style.fontSize = '20px' })
  const picker = homePicker(page)
  await picker.book.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(picker.form.locator('[data-book-id="66"]')).toHaveAttribute('aria-expanded', 'true')
  await picker.form.locator('[data-chapter="1"]').focus()
  await page.keyboard.press('End')
  await expect(picker.form.locator('[data-chapter="22"]')).toBeFocused()
  await expectPopupWithinScreen(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.keyboard.press('Enter')
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
