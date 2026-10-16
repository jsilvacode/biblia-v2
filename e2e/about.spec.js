import { expect, test } from '@playwright/test'

const footer = (page) => page.getByRole('contentinfo')
const help = (page) => page.locator('#ayuda')
const helpLink = (page) => footer(page).getByRole('link', { name: /^(Ayuda|Help|Ajuda)$/ })

test('the footer opens the real About page and keeps its utility links comfortable to use', async ({ page }) => {
  await page.goto('/bible')
  const links = footer(page).getByRole('link')
  await expect(links).toHaveCount(3)
  for (const link of await links.all()) {
    const box = await link.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await expect(footer(page).getByRole('link', { name: 'Contacto', exact: true })).toHaveAttribute('href', 'mailto:jsilvacode@gmail.com')
  await footer(page).getByRole('link', { name: 'Acerca de', exact: true }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { name: 'Acerca de Santa Biblia', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('main dd')).toHaveText(['3.0', 'Julio Silva'])
  await expect(page.locator('main article')).toHaveCount(5)
  await expect(page.locator('article[aria-labelledby="help-offline"]')).toContainText('Ajustes → Descargar versiones')
  await expect(page.locator('article[aria-labelledby="help-offline"]')).toContainText('Disponible sin conexión')
  await expect(page.locator('main')).not.toContainText('{{')
})

test('Help reaches and focuses its anchor from another page, the same page, direct entry and browser back', async ({ page }) => {
  const atHelp = async () => {
    await expect(page).toHaveURL(/\/about#ayuda$/)
    await expect(help(page)).toBeFocused()
    await expect(help(page)).toBeInViewport()
    const bounds = await help(page).boundingBox()
    const header = await page.locator('.site-header').boundingBox()
    expect(bounds.y).toBeGreaterThanOrEqual(header.height)
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  }
  await page.goto('/search')
  await helpLink(page).click()
  await atHelp()
  await helpLink(page).click()
  await atHelp()
  await page.goto('/about#ayuda')
  await atHelp()
  await page.getByRole('link', { name: 'Santa Biblia', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goBack()
  await atHelp()
})

test('About stays readable in all interface languages at compact and wide sizes', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'mobile' ? [320, 768] : [1024, 1440]
  await page.goto('/')
  for (const [locale, title] of [['es', 'Acerca de Santa Biblia'], ['en', 'About Santa Biblia'], ['pt-BR', 'Sobre Santa Bíblia']]) {
    await page.evaluate((nextLocale) => localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ locale: nextLocale, bibleVersion: 'nbla' })), locale)
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/about')
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
      await expect(page.locator('main article')).toHaveCount(5)
      await expect(page.locator('main')).not.toContainText('{{')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  }
})
