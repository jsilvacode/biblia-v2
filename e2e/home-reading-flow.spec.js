import { expect, test } from '@playwright/test'

const continueLabel = /Continuar leyendo|Continue reading|Continuar lendo/
const chooseReadingLabel = /Elegir libro y capítulo|Choose book and chapter|Escolher livro e capítulo/
const promiseTitle = /Promesa del día|Promise of the day|Promessa do dia/

async function clearAppStorage(page) {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
}

test('Home always gives a daily promise, the annual reading and the promises guide', async ({ page }) => {
  await clearAppStorage(page)

  const hero = page.getByRole('region', { name: promiseTitle })
  await expect(hero.getByRole('heading')).toBeVisible()

  const promiseReading = hero.getByRole('link', { name: /Leer capítulo|Read chapter|Ler capítulo/ })
  await expect(promiseReading).toHaveAttribute('href', /^\/read\/\d+\/\d+\/\d+$/)

  const dailyReading = page.getByRole('link', { name: /Reavivados por su Palabra|Revived by His Word|Reavivados por Sua Palavra/ })
  await expect(dailyReading).toHaveAttribute('href', /^\/read\/\d+\/\d+$/)
  await expect(page.getByRole('link', { name: /Promesas de Dios|Promises of God|Promessas de Deus/ }).last()).toHaveAttribute('href', '/topics')
  await expect(page.getByText(/Qué leer cuando|What to read when|O que ler quando/)).toBeVisible()
  await expect(page.getByText(/Guía de consulta bíblica|Bible reference guide|Guia de consulta bíblica/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /La Fe de Jesús|The Faith of Jesus|A Fé de Jesus/ })).toHaveAttribute('href', '/studies/la-fe-de-jesus')
})

test('a new reader starts from a clean book and chapter picker', async ({ page }) => {
  await clearAppStorage(page)
  await expect(page.getByText(continueLabel)).toHaveCount(0)

  await page.getByRole('button', { name: chooseReadingLabel }).click()
  const picker = page.getByRole('dialog', { name: /Ir a|Go to|Ir para/ })
  await expect(picker).toBeVisible()
  await expect(picker.locator('.book-list__item.is-selected')).toHaveCount(0)
  await expect(picker.getByRole('button', { name: '1', exact: true })).toHaveCount(0)

  await picker.getByRole('button', { name: /Génesis|Genesis|Gênesis/ }).click()
  await picker.getByRole('button', { name: '1', exact: true }).click()
  await expect(page).toHaveURL(/\/read\/1\/1$/)
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0)
})

test('a returning reader can resume the last reading directly from Home', async ({ page }) => {
  await clearAppStorage(page)

  await page.goto('/read/43/3/16')
  await expect(page.locator('#verse-16')).toBeVisible()
  await expect.poll(() => page.evaluate(() => {
    const value = window.localStorage.getItem('santa_biblia_v2_reading')
    return value ? JSON.parse(value).updatedAt : null
  })).toBeGreaterThan(0)

  await page.goto('/')
  const continueReading = page.getByRole('link', { name: continueLabel })
  await expect(continueReading).toBeVisible()
  await expect(continueReading).toHaveAttribute('href', /^\/read\/43\/3(?:\/\d+)?$/)
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
  expect(payload.url).toMatch(/\/read\/\d+\/\d+\/\d+\?v=[a-z0-9-]+(?:&end=\d+)?&share=6$/)
  expect(payload).not.toHaveProperty('text')
})
