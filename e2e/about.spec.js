import { expect, test } from '@playwright/test'

const footer = (page) => page.getByRole('contentinfo')
const closeLabel = /^(Cerrar|Close|Fechar)$/

async function expectSupportLinks(surface) {
  for (const [name, url] of [['Mercado Pago', 'https://link.mercadopago.cl/jsilvacoder'], ['PayPal', 'https://paypal.me/jsilvacode']]) {
    const link = surface.getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('href', url)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    await expect(link).toHaveAttribute('rel', /noreferrer/)
    expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44)
  }
}

test('the three footer controls open distinct centered dialogs and restore focus and scroll on close', async ({ page }) => {
  await page.goto('/bible')
  const controls = footer(page).getByRole('button')
  await expect(controls).toHaveCount(3)
  await expect(footer(page).getByRole('link')).toHaveCount(0)
  for (const [index, title] of ['Acerca de Santa Biblia', 'Ayuda para usar Santa Biblia', 'Apoya el proyecto'].entries()) {
    const trigger = controls.nth(index)
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect((await trigger.boundingBox()).height).toBeGreaterThanOrEqual(44)
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: title, exact: true })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await expect(page).toHaveURL(/\/bible$/)
    await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
    await page.evaluate(() => document.fonts.ready)
    const box = await dialog.boundingBox()
    const viewport = page.viewportSize()
    expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1)
    const close = dialog.getByRole('button', { name: closeLabel })
    expect((await close.boundingBox()).x).toBeGreaterThan(box.x + box.width / 2)
    if (index === 0) {
      await expect(dialog.locator('dd')).toHaveText(['3.0', 'Julio Silva'])
      await expect(dialog.getByRole('link', { name: 'jsilvacode@gmail.com', exact: true })).toHaveAttribute('href', 'mailto:jsilvacode@gmail.com')
      await expect(dialog.locator('article, a[target="_blank"]')).toHaveCount(0)
    } else if (index === 1) {
      await expect(dialog.getByRole('article')).toHaveCount(5)
      const offline = dialog.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Preparar la lectura sin conexión', exact: true }) })
      await expect(offline).toContainText('Ajustes → Descargar versiones')
      await expect(offline).toContainText('Disponible sin conexión')
      await expect(dialog.getByRole('link')).toHaveCount(0)
    } else {
      await expect(dialog).toContainText('Este proyecto es gratuito y sin anuncios.')
      await expectSupportLinks(dialog)
      await expect(dialog.locator('article, a[href^="mailto:"]')).toHaveCount(0)
    }
    const lockedY = await page.locator('body').evaluate(element => Math.max(0, -parseFloat(element.style.top)))
    if (index === 1) await page.keyboard.press('Escape')
    else await close.click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(lockedY)
  }
})

test('legacy About URLs keep their full content, anchor focus and browser-back behavior', async ({ page }) => {
  const atAnchor = async (id) => {
    const heading = page.locator(`#${id}`)
    await expect(page).toHaveURL(new RegExp(`/about#${id}$`))
    await expect(heading).toBeFocused()
    await expect(heading).toBeInViewport()
    const bounds = await heading.boundingBox()
    const header = await page.locator('.site-header').boundingBox()
    expect(bounds.y).toBeGreaterThanOrEqual(header.height)
  }
  await page.goto('/about')
  await expect(page.locator('main h1')).toBeFocused()
  await expect(page.locator('main article')).toHaveCount(5)
  await expect(page.locator('main').getByRole('link', { name: 'jsilvacode@gmail.com', exact: true })).toHaveAttribute('href', 'mailto:jsilvacode@gmail.com')
  await expectSupportLinks(page.locator('main'))
  for (const id of ['ayuda', 'apoya']) {
    await page.goto(`/about#${id}`)
    await atAnchor(id)
    await page.goto(`/about#${id}`)
    await atAnchor(id)
    await page.goto('/about')
    await expect(page.locator('main h1')).toBeFocused()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await page.goBack()
    await atAnchor(id)
    await page.getByRole('link', { name: 'Santa Biblia', exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goBack()
    await atAnchor(id)
  }
})

test('footer controls and project content fit all languages, themes and supported widths', async ({ page }, testInfo) => {
  const widths = testInfo.project.name === 'mobile' ? [320, 768] : [1024, 1440]
  await page.goto('/')
  for (const [locale, title, supportTitle] of [['es', 'Acerca de Santa Biblia', 'Apoya el proyecto'], ['en', 'About Santa Biblia', 'Support the project'], ['pt-BR', 'Sobre Santa Bíblia', 'Apoie o projeto']]) {
    for (const theme of ['light', 'dark']) {
      await page.evaluate((settings) => localStorage.setItem('santa_biblia_v2_settings', JSON.stringify(settings)), { locale, theme, bibleVersion: 'nbla' })
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto('/about')
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
        await expect(page.locator('main article')).toHaveCount(5)
        await expect(page.locator('main')).not.toContainText('{{')
        const navigation = footer(page).getByRole('navigation')
        const controls = navigation.getByRole('button')
        await expect(controls).toHaveCount(3)
        await expect(navigation.getByRole('link')).toHaveCount(0)
        const [navigationBox, authorBox] = await Promise.all([navigation.boundingBox(), footer(page).getByText(/Julio Silva/).boundingBox()])
        expect(navigationBox.y).toBeGreaterThanOrEqual(authorBox.y + authorBox.height)
        expect(Math.abs(navigationBox.x + navigationBox.width / 2 - width / 2)).toBeLessThanOrEqual(1)
        for (const control of await controls.all()) {
          const box = await control.boundingBox()
          expect(box.height).toBeGreaterThanOrEqual(44)
          expect(box.x).toBeGreaterThanOrEqual(0)
          expect(box.x + box.width).toBeLessThanOrEqual(width)
        }
        await controls.last().click()
        const dialog = page.getByRole('dialog', { name: supportTitle, exact: true })
        await expect(dialog).toBeVisible()
        await expectSupportLinks(dialog)
        const box = await dialog.boundingBox()
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(width)
        expect(box.y).toBeGreaterThanOrEqual(0)
        expect(box.y + box.height).toBeLessThanOrEqual(900)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
        await page.keyboard.press('Escape')
        await expect(controls.last()).toBeFocused()
      }
    }
  }
})
