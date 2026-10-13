import { expect, test } from '@playwright/test'

test.describe('thematic reading modal', () => {
  test('opens a bookmarked situation without loading text and keeps the page position on close', async ({ page }) => {
    await page.goto('/topics/temor-ansiedad-y-paz/tengo-miedo')
    const readings = page.getByTestId('topic-readings')
    await expect(readings.getByRole('button')).toHaveCount(6)
    const citation = readings.getByRole('button', { name: /Salmos? 23:1-4/ })
    await citation.scrollIntoViewIfNeeded()
    const before = await page.evaluate(() => ({ y: window.scrollY, history: localStorage.getItem('santa_biblia_v2_reading') }))
    const url = page.url()
    await citation.click()
    const dialog = page.getByRole('dialog', { name: /Salmos? 23:1-4/ })
    await expect(dialog.getByTestId('passage-preview-text').locator('p')).toHaveCount(4)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(citation).toBeFocused()
    await expect(page).toHaveURL(url)
    expect(await page.evaluate(() => localStorage.getItem('santa_biblia_v2_reading'))).toBe(before.history)
    expect(Math.abs(await page.evaluate(() => window.scrollY) - before.y)).toBeLessThanOrEqual(2)
  })

  test('honors legacy links and gives a useful destination for an unknown situation', async ({ page }) => {
    await page.goto('/topics?category=temor-ansiedad-y-paz#topic-temor-ansiedad-y-paz-tengo-miedo-del-futuro')
    await expect(page.getByRole('heading', { name: 'Tengo miedo del futuro', exact: true })).toBeVisible()
    await page.goto('/topics/temor-ansiedad-y-paz/no-existe')
    await expect(page.getByRole('heading', { name: /Esta situación no está disponible|This situation is not available|Esta situação não está disponível/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ir a la guía|Go to the guide|Ir ao guia/ })).toHaveAttribute('href', '/topics')
  })

  test('retries a failed reading without navigating away from the situation', async ({ page }) => {
    let attempts = 0
    await page.route('**/data/nbla/19_salmos/27.json', async (route) => {
      attempts += 1
      if (attempts === 1) await route.fulfill({ status: 503, body: 'Unavailable' })
      else await route.continue()
    })
    await page.goto('/topics/temor-ansiedad-y-paz/tengo-miedo')
    await page.getByTestId('topic-readings').getByRole('button', { name: /Salmos? 27/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('alert')).toBeVisible()
    await dialog.getByRole('button', { name: /Reintentar|Try again|Tentar novamente/ }).click()
    await expect(dialog.getByTestId('passage-preview-text')).toBeVisible()
    await expect(page).toHaveURL(/\/topics\/temor-ansiedad-y-paz\/tengo-miedo$/)
    expect(attempts).toBe(2)
  })
})
