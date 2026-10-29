import { expect, test } from '@playwright/test'

async function selectCategory(page, id) {
  await expect(page.getByRole('searchbox')).toBeVisible()
  const cards = page.getByRole('group', { name: 'Filtrar libros', exact: true })
  if (await cards.isVisible()) {
    await cards.locator(`[data-category-id="${id}"]`).click()
    return
  }
  const selector = page.getByRole('combobox', { name: 'Filtrar libros', exact: true })
  await selector.click()
  await page.getByRole('listbox').locator(`[data-category-id="${id}"]`).click()
  await expect(selector).toHaveAttribute('aria-expanded', 'false')
}

async function expectSelectedCategory(page, id, text) {
  const cards = page.getByRole('group', { name: 'Filtrar libros', exact: true })
  if (await cards.isVisible()) {
    await expect(cards.locator(`[data-category-id="${id}"]`)).toHaveAttribute('aria-pressed', 'true')
    await expect(cards.getByRole('button', { pressed: true })).toHaveCount(1)
  } else {
    await expect(page.getByRole('combobox', { name: 'Filtrar libros', exact: true })).toHaveText(text)
  }
}

async function openOldTestament(page) {
  await page.goto('/biblia')
  await selectCategory(page, 'OT')
}

test('opens all 66 books with category cards on desktop and the icon dropdown on mobile', async ({ page, isMobile }) => {
  await page.goto('/biblia')
  const selector = page.getByRole('combobox', { name: 'Filtrar libros', exact: true })
  const cards = page.getByRole('group', { name: 'Filtrar libros', exact: true })
  if (isMobile) {
    await expect(cards).not.toBeVisible()
    await expect(selector).toHaveText('Todos los libros66')
    await selector.click()
    await expect(page.getByRole('option')).toHaveCount(13)
    await expect(page.getByRole('option', { selected: true })).toHaveCount(1)
    await expect(page.getByRole('option').locator('svg')).toHaveCount(13)
    await selector.press('Escape')
  } else {
    await expect(selector).not.toBeVisible()
    await expect(cards.getByRole('button')).toHaveCount(13)
    await expect(cards.getByRole('button').locator('svg')).toHaveCount(13)
    await expectSelectedCategory(page, 'all')
  }
  const results = page.locator('#bible-book-results')
  await expect(results.getByRole('region', { name: 'Antiguo Testamento', exact: true }).locator('[data-book-id]')).toHaveCount(39)
  await expect(results.getByRole('region', { name: 'Nuevo Testamento', exact: true }).locator('[data-book-id]')).toHaveCount(27)
  expect(await results.locator('[data-book-id]').evaluateAll(elements => elements.map(element => Number(element.dataset.bookId))))
    .toEqual(Array.from({ length: 66 }, (_, index) => index + 1))

  // Categories are global peers: no testament selection is needed first.
  for (const [id, first, last] of [['minorProphets', 28, 39], ['NT', 40, 66], ['gospels', 40, 43], ['OT', 1, 39], ['all', 1, 66]]) {
    await selectCategory(page, id)
    await expect(results.locator('[data-book-id]')).toHaveCount(last - first + 1)
    expect(await results.locator('[data-book-id]').evaluateAll(elements => elements.map(element => Number(element.dataset.bookId))))
      .toEqual(Array.from({ length: last - first + 1 }, (_, index) => index + first))
    if (isMobile) {
      await selector.click()
      await expect(page.getByRole('option', { selected: true })).toHaveAttribute('data-category-id', id)
      await selector.press('Escape')
    } else {
      await expectSelectedCategory(page, id)
    }
  }
})

test('historical and letter filters use the requested cross-testament and 14/7 groupings', async ({ page }) => {
  await page.goto('/biblia')
  const results = page.locator('#bible-book-results')
  await selectCategory(page, 'history')
  await expect(results.locator('[data-book-id]')).toHaveCount(13)
  await expect(results.getByRole('region', { name: 'Antiguo Testamento', exact: true }).locator('[data-book-id]')).toHaveCount(12)
  await expect(results.getByRole('region', { name: 'Nuevo Testamento', exact: true }).locator('[data-book-id="44"]')).toHaveCount(1)
  await selectCategory(page, 'letters')
  await expect(results.locator('[data-book-id]')).toHaveCount(21)
  await selectCategory(page, 'paulineLetters')
  await expect(results.locator('[data-book-id]')).toHaveCount(14)
  await expect(results.locator('[data-book-id="58"]')).toHaveCount(1)
  await expect(results.locator('[data-book-id="59"]')).toHaveCount(0)
  await selectCategory(page, 'generalLetters')
  await expect(results.locator('[data-book-id]')).toHaveCount(7)
  await expect(results.locator('[data-book-id="58"]')).toHaveCount(0)
  await expect(results.locator('[data-book-id="59"]')).toHaveCount(1)
})

test('the category dropdown is bounded on mobile and keeps its selection after closing chapters', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/biblia')
  const selector = page.getByRole('combobox', { name: 'Filtrar libros', exact: true })
  await selector.click()
  const list = page.getByRole('listbox')
  const box = await list.boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(568)
  expect(box.height).toBeLessThanOrEqual(289)
  await selector.press('End')
  await selector.press('Enter')
  await expect(page.locator('[data-book-id]')).toHaveCount(1)
  await selectCategory(page, 'gospels')
  const results = page.locator('#bible-book-results')
  await expect(results.locator('[data-book-id]')).toHaveCount(4)
  const john = results.locator('[data-book-id="43"]')
  await john.click()
  const dialog = page.getByRole('dialog', { name: 'Juan', exact: true })
  await expect(dialog.getByRole('link')).toHaveCount(21)
  await page.keyboard.press('Escape')
  await expect(john).toBeFocused()
  await expect(selector).toHaveText('Evangelios4')
})

test('search spans the whole Bible and clearing it restores the selected category', async ({ page }) => {
  await page.goto('/biblia')
  await selectCategory(page, 'minorProphets')
  const input = page.getByRole('searchbox')
  await input.fill('juan')
  await expect(page.locator('[data-book-id="43"]')).toBeVisible()
  await expect(page.getByText('Resultados en ambos testamentos', { exact: true })).toBeVisible()
  await input.fill('')
  await expect(page.locator('#bible-book-results').getByRole('heading', { name: 'Profetas menores', exact: true })).toBeVisible()
  await expect(page.locator('[data-book-id]')).toHaveCount(12)
  await expectSelectedCategory(page, 'minorProphets', 'Profetas menores12')
})

test('tablet cards keep the same filter when resizing to and from the mobile dropdown', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/biblia')
  const cards = page.getByRole('group', { name: 'Filtrar libros', exact: true })
  const selector = page.getByRole('combobox', { name: 'Filtrar libros', exact: true })
  await expect(cards.getByRole('button')).toHaveCount(13)
  await expect(selector).not.toBeVisible()
  const prophets = cards.locator('[data-category-id="minorProphets"]')
  await prophets.focus()
  await prophets.press('Enter')
  await expect(page.locator('[data-book-id]')).toHaveCount(12)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(cards).not.toBeVisible()
  await expect(selector).toHaveText('Profetas menores12')
  await selectCategory(page, 'gospels')
  await selector.click()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(selector).not.toBeVisible()
  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expectSelectedCategory(page, 'gospels')
  await expect(page.locator('[data-book-id]')).toHaveCount(4)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('choosing a book opens its chapters in a centred modal and goes directly to reading', async ({ page }) => {
  const corpusRequests = []
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/data/')) corpusRequests.push(request.url())
  })
  await openOldTestament(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.locator('[data-book-id="1"]').click()
  const dialog = page.getByRole('dialog', { name: 'Génesis', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link')).toHaveCount(50)
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()
  expect(box.width).toBeLessThanOrEqual(480)
  expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(2)
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(2)
  expect(corpusRequests).toEqual([])
  await dialog.getByRole('link', { name: '2', exact: true }).click()
  await expect(page).toHaveURL(/\/biblia\/genesis\/2$/)
  await expect(page.locator('#verse-1')).toBeVisible()
  expect(corpusRequests.length).toBeGreaterThan(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('#root')).not.toHaveAttribute('aria-hidden', 'true')
})

test('long chapter lists stay inside a small screen and preserve list position and focus on close', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openOldTestament(page)
  const book = page.locator('[data-book-id="19"]')
  await book.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => scrollY)
  await book.click()
  const dialog = page.getByRole('dialog', { name: 'Salmos', exact: true })
  await expect(dialog.getByRole('link')).toHaveCount(150)
  const box = await dialog.boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(16)
  expect(box.y).toBeGreaterThanOrEqual(16)
  expect(box.x + box.width).toBeLessThanOrEqual(304)
  expect(box.y + box.height).toBeLessThanOrEqual(552)
  await dialog.getByRole('link', { name: '150', exact: true }).scrollIntoViewIfNeeded()
  await expect(dialog.getByRole('link', { name: '150', exact: true })).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(book).toBeFocused()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scrollBefore)

  await book.click()
  await page.locator('.reader-dialog-backdrop').click({ position: { x: 4, y: 4 } })
  await expect(dialog).toHaveCount(0)
  await expect(book).toBeFocused()
})

test('a book found by name keeps its search after closing the chapter modal', async ({ page }) => {
  await page.goto('/biblia')
  const search = page.getByRole('searchbox')
  await search.fill('salmos')
  const book = page.locator('[data-book-id="19"]')
  await book.click()
  const dialog = page.getByRole('dialog', { name: 'Salmos', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await expect(search).toHaveValue('salmos')
  await expect(book).toBeFocused()
  await book.press('Enter')
  const input = dialog.getByRole('spinbutton', { name: 'Ir al capítulo' })
  await input.fill('151')
  await expect(dialog.getByRole('button', { name: 'Abrir', exact: true })).toBeDisabled()
  await input.fill('150')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/biblia\/salmos\/150$/)
  await expect(page.locator('#verse-1')).toBeVisible()
})
