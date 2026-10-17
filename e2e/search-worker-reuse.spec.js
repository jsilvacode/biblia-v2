import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ bibleVersion: 'nbla', locale: 'es', theme: 'light' }))
  })
})

test('Home, reader and full search reuse one worker and one index load during SPA navigation', async ({ page }) => {
  const workers = []
  const indexes = []
  page.on('worker', worker => workers.push(worker.url()))
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/data/search/nbla.json') indexes.push(request.url())
  })
  await page.goto('/')
  const home = page.getByTestId('home-reading-panel')
  await home.getByRole('searchbox').fill('tal manera mundo')
  await home.getByRole('link', { name: /Juan 3:16/ }).click()
  await expect(page).toHaveURL(/\/read\/43\/3\/16$/)
  await expect(page.locator('#verse-16')).toBeVisible()
  const row = page.getByTestId('reader-passage-row')
  await row.scrollIntoViewIfNeeded()
  if (page.viewportSize().width <= 767) await row.getByRole('button', { name: 'Búsqueda rápida', exact: true }).click()
  await row.getByRole('searchbox').fill('mundo')
  await row.getByRole('link', { name: 'Ver más resultados', exact: true }).click()
  await expect(page).toHaveURL(/\/search\?q=mundo$/)
  await expect(page.locator('.result-count')).toHaveText(/50 de [1-9]\d{2} resultados/)
  expect(workers).toHaveLength(1)
  expect(indexes).toHaveLength(1)
})

test('direct references do not start a text-search worker in Home, reader or Search', async ({ page }) => {
  const workers = []
  page.on('worker', worker => workers.push(worker.url()))
  await page.goto('/')
  const home = page.getByTestId('home-reading-panel')
  await home.getByRole('searchbox').fill('Juan 3:16')
  await home.getByRole('searchbox').press('Enter')
  await expect(page).toHaveURL(/\/read\/43\/3\/16$/)
  await expect(page.locator('#verse-16')).toBeVisible()
  const row = page.getByTestId('reader-passage-row')
  await row.scrollIntoViewIfNeeded()
  if (page.viewportSize().width <= 767) await row.getByRole('button', { name: 'Búsqueda rápida', exact: true }).click()
  await row.getByRole('searchbox').fill('Salmos 23:1')
  await row.getByRole('searchbox').press('Enter')
  await expect(page).toHaveURL(/\/read\/19\/23\/1$/)
  await page.getByRole('link', { name: 'Buscar', exact: true }).first().click()
  await expect(page).toHaveURL(/\/search$/)
  await page.getByRole('searchbox').fill('Juan 3:16')
  await expect(page.getByRole('link', { name: /Juan 3:16/ })).toBeVisible()
  expect(workers).toEqual([])
})

for (const surface of ['search', 'home', 'bible']) {
  test(`${surface} retries the same word query after an index failure`, async ({ page }) => {
    let requests = 0
    await page.route('**/data/search/nbla.json', async (route) => {
      requests += 1
      if (requests === 1) await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
      else await route.continue()
    })
    await page.goto(surface === 'home' ? '/' : `/${surface}`)
    const region = surface === 'home' ? page.getByTestId('home-reading-panel') : page.locator('main')
    const input = region.getByRole('searchbox')
    await input.fill('Nicodemo')
    await expect(region.getByRole('alert')).toHaveText('No fue posible cargar la búsqueda.')
    await expect(input).toHaveValue('Nicodemo')
    await region.getByRole('button', { name: 'Intentar de nuevo', exact: true }).click()
    await expect(region.getByRole('link', { name: /Juan 3:1/ })).toBeVisible()
    await expect(input).toHaveValue('Nicodemo')
    expect(requests).toBe(2)
  })
}
