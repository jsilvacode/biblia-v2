import { expect, test } from '@playwright/test'

test.describe('thematic guide details', () => {
  test('opens a focused situation, loads one companion on demand and returns from the reader', async ({ page }) => {
    await page.goto('/topics?category=temor-ansiedad-y-paz&q=miedo')

    await page.getByRole('link', { name: /Tengo miedo.*Salmo 27/i }).click()
    await expect(page).toHaveURL(/\/topics\/temor-ansiedad-y-paz\/tengo-miedo\?category=temor-ansiedad-y-paz&q=miedo$/)
    await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Salmos? 27/, exact: true })).toBeVisible()
    await expect(page.locator('[class*="companionPassage"]')).toHaveCount(0)

    await page.getByRole('link', { name: 'Salmo 23:1-4', exact: true }).click()
    await expect(page).toHaveURL(/reading=companion-1/)
    await expect(page.locator('[class*="companionPassage"]')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: /Salmos? 23:1-4/, exact: true })).toBeVisible()

    await page.getByRole('link', { name: /Leer en el lector|Read in reader|Ler no leitor/ }).first().click()
    await expect(page).toHaveURL(/\/read\/19\/27$/)
    await page.getByRole('button', { name: /Volver a la guía|Back to the guide|Voltar ao guia/ }).click()
    await expect(page).toHaveURL(/\/topics\/temor-ansiedad-y-paz\/tengo-miedo\?category=temor-ansiedad-y-paz&q=miedo&reading=companion-1$/)
  })

  test('migrates a legacy situation link and gives a useful page for an unknown one', async ({ page }) => {
    await page.goto('/topics?category=temor-ansiedad-y-paz#topic-temor-ansiedad-y-paz-tengo-miedo-del-futuro')
    await expect(page).toHaveURL(/\/topics\/temor-ansiedad-y-paz\/tengo-miedo-del-futuro\?category=temor-ansiedad-y-paz$/)
    await expect(page.getByRole('heading', { name: 'Tengo miedo del futuro', exact: true })).toBeVisible()

    await page.goto('/topics/temor-ansiedad-y-paz/no-existe')
    await expect(page.getByRole('heading', { name: /Esta situación no está disponible|This situation is not available|Esta situação não está disponível/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ir a la guía|Go to the guide|Ir ao guia/ })).toHaveAttribute('href', '/topics')
  })

  test('keeps global compact navigation fixed while reading a topic', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'The compact global navigation is not rendered on desktop.')
    await page.goto('/topics/temor-ansiedad-y-paz/tengo-miedo')

    const navigation = page.locator('.mobile-navigation')
    await expect(navigation).toHaveCSS('visibility', 'visible')
    await page.waitForTimeout(3400)
    await expect(navigation).toHaveCSS('visibility', 'visible')

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(() => page.evaluate(() => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)).toBe(true)
    await page.waitForTimeout(3400)
    await expect(navigation).toHaveCSS('visibility', 'visible')
  })
})
