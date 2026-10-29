import { expect, test } from '@playwright/test'

test('bookmarks and highlights reopen their original translation after a preference change', async ({ page }) => {
  await page.goto('/biblia/juan/3/16?v=rva2015')
  const actions = page.getByRole('dialog', { name: 'Acciones del versículo', exact: true })
  const verse = page.locator('#verse-16')
  await expect(verse).toContainText('ha dado a su Hijo unigénito')
  await verse.click()
  await actions.getByRole('button', { name: 'Guardar versículo', exact: true }).click()
  await expect(actions).toBeHidden()
  await verse.click()
  await actions.getByRole('button', { name: 'Destacar versículo', exact: true }).click()
  await expect(actions).toBeHidden()

  for (const tab of ['Versículos guardados', 'Resaltados']) {
    await page.goto('/settings')
    await page.locator('#settings-version').selectOption('nbla')
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('santa_biblia_v2_settings')).bibleVersion)).toBe('nbla')
    await page.goto('/saved')
    if (tab === 'Resaltados') await page.getByRole('tab', { name: tab, exact: true }).click()
    const saved = page.locator('.saved-list').getByRole('link', { name: /Juan 3:16/ })
    await expect(saved).toContainText('RVA2015')
    await expect(saved).toHaveAttribute('href', '/biblia/juan/3/16?v=rva2015')
    await saved.click()
    await expect(page).toHaveURL(/\/biblia\/juan\/3\/16\?v=rva2015$/)
    await expect(verse).toContainText('ha dado a su Hijo unigénito')
    await expect(verse).toHaveClass(/is-highlighted/)
    await verse.click()
    await expect(actions.getByRole('button', { name: 'Quitar guardado', exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
  }
})
