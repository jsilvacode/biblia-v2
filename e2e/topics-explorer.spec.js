import { expect, test } from '@playwright/test'

async function selectFearArea(page, testInfo) {
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: /Ver áreas|View areas|Ver áreas/ }).click()
  }

  await page.getByRole('button', { name: /Temor, ansiedad y paz/ }).click()
}

test.describe('thematic guide explorer', () => {
  test('starts with twelve situations and searches the full editorial collection as you type', async ({ page }) => {
    await page.goto('/topics')

    await expect(page.getByRole('heading', { name: /¿Qué necesitas hoy|What do you need today|Do que você precisa hoje/i })).toBeVisible()
    await expect(page.locator('a[class*="situationCard"]')).toHaveCount(12)
    await expect(page.getByText(/12 de 92 situaciones|12 of 92 situations|12 de 92 situações/)).toBeVisible()

    await page.getByRole('button', { name: /Ver más situaciones|Show more situations|Ver mais situações/ }).click()
    await expect(page.locator('a[class*="situationCard"]')).toHaveCount(24)

    const search = page.getByRole('searchbox', { name: /Buscar una situación o referencia|Search for a situation or reference|Buscar uma situação ou referência/ })
    await search.fill('corazón quebrantado')

    await expect(page).toHaveURL(/\/topics\?q=coraz%C3%B3n(?:\+|%20)quebrantado$/)
    await expect(page.locator('a[class*="situationCard"]')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Siento el corazón quebrantado', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Ver más situaciones|Show more situations|Ver mais situações/ })).toHaveCount(0)
  })

  test('combines the URL area filter with a live query and keeps the first twelve limit', async ({ page }, testInfo) => {
    await page.goto('/topics')
    await selectFearArea(page, testInfo)

    await expect(page).toHaveURL(/\/topics\?category=temor-ansiedad-y-paz$/)
    await expect(page.locator('a[class*="situationCard"]')).toHaveCount(8)

    const search = page.getByRole('searchbox')
    await search.fill('miedo')
    await expect(page).toHaveURL(/\/topics\?category=temor-ansiedad-y-paz&q=miedo|\/topics\?q=miedo&category=temor-ansiedad-y-paz/)
    await expect(page.locator('a[class*="situationCard"]')).toHaveCount(2)
    await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tengo miedo del futuro', exact: true })).toBeVisible()
  })

  test('opens the complete areas panel without making the page horizontally scroll on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only guide layout coverage')
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/topics')

    await page.getByRole('button', { name: /Ver áreas/ }).click()
    await expect(page.locator('#topic-areas').getByRole('button')).toHaveCount(13)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true)
  })

  test('keeps readable cards at compact widths and with enlarged browser text', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only guide layout coverage')

    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport)
      await page.goto('/topics')
      await page.evaluate(() => { document.documentElement.style.fontSize = '20px' })

      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true)
      await expect(page.locator('a[class*="situationCard"]')).toHaveCount(12)
      expect(await page.locator('a[class*="situationCard"]').evaluateAll((cards) => (
        cards.every((card) => card.scrollWidth <= card.clientWidth)
      ))).toBe(true)
    }
  })

  test('uses two result columns beside a sticky area index from tablet width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop-only guide layout coverage')

    for (const viewport of [{ width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      await page.goto('/topics')
      const cards = page.locator('a[class*="situationCard"]')
      await expect(cards).toHaveCount(12)
      const [first, second] = await Promise.all([cards.nth(0).boundingBox(), cards.nth(1).boundingBox()])

      if (!first || !second) throw new Error('The first two situation cards should be rendered.')
      expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1)
      expect(second.x).toBeGreaterThan(first.x)
      await expect(page.locator('[class*="desktopFilters"]')).toHaveCSS('position', 'sticky')
    }
  })
})
