import { expect, test } from '@playwright/test'

async function enlarge(page, path) {
  await page.addInitScript(() => localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ locale: 'es', bibleVersion: 'nbla', readerFontScale: 1.3 })))
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto(path)
  await page.locator('h1').first().waitFor()
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  await page.evaluate(() => document.fonts.ready)
}

async function usableDialog(page) {
  const dialog = page.getByRole('dialog')
  const close = dialog.locator('.reader-dialog__header > button:last-child')
  await expect(dialog).toBeVisible()
  await expect(close).toBeVisible()
  const geometry = await dialog.evaluate(el => ({
    box: el.getBoundingClientRect().toJSON(),
    close: el.querySelector('.reader-dialog__header > button:last-child').getBoundingClientRect().toJSON(),
    title: el.querySelector('.reader-dialog__header h2').getBoundingClientRect().toJSON(),
    overflow: el.scrollWidth > el.clientWidth + 1,
  }))
  expect(geometry.box.top).toBeGreaterThanOrEqual(0)
  expect(geometry.box.bottom).toBeLessThanOrEqual(569)
  expect(geometry.close.top).toBeGreaterThanOrEqual(0)
  expect(geometry.close.bottom).toBeLessThanOrEqual(568)
  expect(geometry.close.right).toBeLessThanOrEqual(320)
  expect(geometry.overflow).toBe(false)
  expect(geometry.close.width).toBeGreaterThanOrEqual(44)
  expect(geometry.close.height).toBeGreaterThanOrEqual(44)
  expect(geometry.title.top).toBeGreaterThanOrEqual(geometry.close.bottom)
  await close.click()
  await expect(dialog).toHaveCount(0)
}

test('the home promise reflows at 200 percent text size on a narrow phone', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-16T12:00:00-03:00'))
  await enlarge(page, '/')
  await expect(page.getByRole('region', { name: 'Promesa del día' })).toHaveAttribute('aria-busy', 'false')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('verse actions and commentary keep a usable close button at 200 percent text size', async ({ page }) => {
  await enlarge(page, '/read/43/3')
  await page.locator('#verse-1').focus()
  await page.keyboard.press('Enter')
  const actions = page.getByRole('dialog')
  expect(await actions.locator('.reader-action-list').evaluate(el => el.clientHeight)).toBeGreaterThan(100)
  await actions.getByRole('button', { name: 'Ver comentario bíblico', exact: true }).scrollIntoViewIfNeeded()
  await usableDialog(page)
  await page.locator('#verse-1').press('Enter')
  await page.getByRole('button', { name: 'Ver comentario bíblico', exact: true }).click()
  const commentaryBody = page.getByRole('dialog').locator('.reader-dialog__scroll-area')
  await expect(commentaryBody.locator('p:not(.reader-dialog__status)').first()).toBeVisible()
  expect(await commentaryBody.evaluate(el => el.clientHeight)).toBeGreaterThan(140)
  expect(await commentaryBody.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
  expect(await page.getByRole('dialog').locator('.reader-dialog__scroll-area').evaluate(el => el.clientHeight)).toBeGreaterThan(100)
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Volver', exact: true })).toBeVisible()
  await usableDialog(page)
})

test('chapter and thematic reading dialogs remain usable with enlarged text', async ({ page }) => {
  await enlarge(page, '/bible')
  await page.locator('[data-book-id="1"]').click()
  await usableDialog(page)
  await enlarge(page, '/topics')
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Tengo miedo', exact: true }).click()
  await page.getByTestId('topic-readings').getByRole('button', { name: /Salmos? 27/ }).click()
  expect(await page.getByRole('dialog').locator('.reader-dialog__scroll-area').evaluate(el => el.clientHeight)).toBeGreaterThan(100)
  await usableDialog(page)
})
