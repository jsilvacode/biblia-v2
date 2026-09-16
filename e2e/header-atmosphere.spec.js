import { expect, test } from '@playwright/test'

async function headerBackground(page, selector) {
  return page.locator(selector).evaluate((element) => getComputedStyle(element, '::before').backgroundImage)
}

test('the Home landscape and transparent active navigation carry to desktop and tablet headers only', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/saved')

  await expect.poll(() => headerBackground(page, '.site-header')).toContain('aurora-champagne-landscape.webp')
  await expect(page.locator('.site-header a[href="/saved"]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')

  await page.setViewportSize({ width: 768, height: 1024 })
  await expect.poll(() => headerBackground(page, '.site-header')).toContain('aurora-champagne-landscape.webp')

  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  await expect.poll(() => headerBackground(page, '.site-header')).toContain('aurora-champagne-landscape.webp')

  await page.goto('/read/43/3')
  await expect.poll(() => headerBackground(page, '.reader-header')).toContain('aurora-champagne-landscape.webp')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/bible')
  await expect.poll(() => headerBackground(page, '.site-header')).not.toContain('aurora-champagne-landscape.webp')
})
