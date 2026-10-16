import { expect, test } from '@playwright/test'

const panel = (page) => page.getByTestId('home-reading-panel')
const searchResults = (page) => panel(page).getByRole('region', { name: 'Resultados de búsqueda', exact: true })

test('Home searches books without starting the full-text worker and opens chapters in the existing modal', async ({ page }) => {
  const workers = []
  page.on('worker', worker => workers.push(worker.url()))
  await page.goto('/')
  await expect(panel(page).getByRole('searchbox')).toBeVisible()
  await expect(panel(page).getByRole('searchbox')).toHaveAttribute('placeholder', 'Buscar cita, palabra o referencia')
  expect(workers).toEqual([])
  const initialPanelHeight = (await panel(page).boundingBox()).height
  await panel(page).getByRole('searchbox').fill('Juan')
  await expect(searchResults(page)).toBeVisible()
  expect((await panel(page).boundingBox()).height).toBe(initialPanelHeight)
  const preview = await searchResults(page).boundingBox()
  expect(preview.y).toBeGreaterThanOrEqual(0)
  expect(preview.y + preview.height).toBeLessThanOrEqual(page.viewportSize().height)
  await searchResults(page).getByRole('button', { name: 'Juan Capítulos: 21', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Juan', exact: true })
  await expect(dialog.getByRole('link')).toHaveCount(21)
  expect(workers).toEqual([])
  await dialog.getByRole('link', { name: '3', exact: true }).click()
  await expect(page).toHaveURL(/\/read\/43\/3$/)
  await expect(page.locator('#verse-1')).toBeVisible()
})

test('a reference entered in Home opens the exact verse directly', async ({ page }) => {
  await page.goto('/')
  const input = panel(page).getByRole('searchbox')
  await input.fill('Juan 3:16')
  await expect(searchResults(page).getByRole('link', { name: /Juan 3:16/ })).toHaveAttribute('href', '/read/43/3/16')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/read\/43\/3\/16$/)
  await expect(page.locator('#verse-16')).toBeVisible()
  await expect(page.locator('#verse-16')).toHaveClass(/is-attention-pulsing/)
})

test('Home returns a short word-search preview and links to the complete results', async ({ page }) => {
  await page.goto('/')
  const input = panel(page).getByRole('searchbox')
  await input.fill('tal manera mundo')
  const result = searchResults(page).getByRole('link', { name: /Juan 3:16/ })
  await expect(result).toBeVisible()
  await expect(searchResults(page).locator('a[href^="/read/"]')).toHaveCount(1)
  await input.fill('mundo')
  await expect(searchResults(page).locator('a[href^="/read/"]')).toHaveCount(3)
  await searchResults(page).getByRole('link', { name: /Ver más resultados/ }).click()
  await expect(page).toHaveURL(/\/search\?q=mundo$/)
  await expect(page.getByText(/50 de [1-9]\d{2} resultados/, { exact: true })).toBeVisible()
})

test('Home preserves recent readings across reload and shows only the latest on mobile', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('recent-readings-fixture')) return
    const readings = [
      { book: 43, chapter: 3, verse: 16, progress: 40, updatedAt: 300 },
      { book: 19, chapter: 23, verse: 4, progress: 50, updatedAt: 200 },
      { book: 1, chapter: 1, verse: 5, progress: 20, updatedAt: 100 },
    ]
    localStorage.setItem('santa_biblia_v2_reading', JSON.stringify(readings[0]))
    localStorage.setItem('santa_biblia_v2_recent_readings', JSON.stringify(readings))
    localStorage.setItem('recent-readings-fixture', 'ready')
  })
  await page.goto('/')
  const isMobile = page.viewportSize().width <= 620
  const history = panel(page).getByRole('region', { name: /^(?:Última lectura|Lecturas recientes)$/ })
  await expect(history).toHaveAccessibleName(isMobile ? 'Última lectura' : 'Lecturas recientes')
  await expect(history.getByRole('link')).toHaveCount(isMobile ? 1 : 3)
  await expect(history.locator('a')).toHaveCount(3)
  await expect(history.getByRole('link').first().getByText('Continuar', { exact: true })).toBeVisible()
  await expect(history.getByText('Continuar', { exact: true })).toHaveCount(1)
  const [historyBox, pickerBox] = await Promise.all([history.boundingBox(), panel(page).getByTestId('home-reading-actions').boundingBox()])
  expect(historyBox.y + historyBox.height).toBeLessThanOrEqual(pickerBox.y)
  const links = await history.getByRole('link').all()
  const boxes = await Promise.all(links.map(link => link.boundingBox()))
  if (page.viewportSize().width >= 768) {
    expect(Math.max(...boxes.map(box => box.y)) - Math.min(...boxes.map(box => box.y))).toBeLessThan(1)
  }
  expect(await history.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))))
    .toEqual(['/read/43/3/16', '/read/19/23/4', '/read/1/1/5'])
  await page.reload()
  await expect(history.getByRole('link')).toHaveCount(isMobile ? 1 : 3)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(history).toHaveAccessibleName('Última lectura')
  await expect(history.getByRole('link')).toHaveCount(1)
  await expect(history.getByRole('link')).toHaveAttribute('href', '/read/43/3/16')
  await expect(history.getByRole('link').getByText('Continuar', { exact: true })).toBeVisible()
  await page.setViewportSize({ width: 1024, height: 844 })
  await expect(history).toHaveAccessibleName('Lecturas recientes')
  await expect(history.getByRole('link')).toHaveCount(3)
  await history.getByRole('link', { name: /Reanudar lectura: Salmos 23:4/ }).click()
  await expect(page).toHaveURL(/\/read\/19\/23\/4$/)
  await expect(page.locator('#verse-4')).toBeVisible()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('santa_biblia_v2_recent_readings'))[0].book)).toBe(19)
  await page.goto('/')
  await expect(history.getByRole('link')).toHaveCount(3)
  await expect(history.getByRole('link').first()).toHaveAttribute('href', /^\/read\/19\/23\/\d+$/)
})

test('search preview closes with Escape and restores its book trigger after a chapter modal', async ({ page }) => {
  await page.goto('/')
  const input = panel(page).getByRole('searchbox')
  await input.fill('Juan')
  const book = searchResults(page).getByRole('button', { name: 'Juan Capítulos: 21', exact: true })
  await book.click()
  const dialog = page.getByRole('dialog', { name: 'Juan', exact: true })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(book).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(searchResults(page)).toHaveCount(0)
  await expect(input).toBeFocused()
  await expect(input).toHaveValue('Juan')
})

test('Home sends partial book-name searches to the Bible catalogue with the query preserved', async ({ page }) => {
  await page.goto('/')
  const input = panel(page).getByRole('searchbox')
  await input.fill('corint')
  await input.press('Enter')
  await expect(page).toHaveURL(/\/bible\?q=corint$/)
  await expect(page.locator('main').getByRole('searchbox')).toHaveValue('corint')
  await expect(page.locator('[data-book-id]')).toHaveCount(2)
})
