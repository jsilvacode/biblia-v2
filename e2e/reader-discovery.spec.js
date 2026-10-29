import { expect, test } from '@playwright/test'

test('verse help appears once and Copy is the first focused action', async ({ page }) => {
  await page.goto('/biblia/juan/3')
  const hint = page.getByTestId('reader-action-hint')
  await expect(hint).toBeVisible()
  await page.locator('#verse-1').focus()
  await page.keyboard.press('Enter')
  const actions = page.getByRole('dialog', { name: 'Acciones del versículo' })
  await expect(actions.getByRole('button', { name: 'Copiar versículo', exact: true })).toBeFocused()
  await expect(actions.locator('.reader-action-list button')).toHaveText([
    'Copiar versículo', 'Guardar versículo', 'Destacar versículo', 'Compartir versículo', 'Ver comentario bíblico',
  ])
  await expect(hint).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.locator('#verse-1')).toBeFocused()
  await page.reload()
  await expect(page.locator('#verse-1')).toBeVisible()
  await expect(hint).toHaveCount(0)
})

test('verse help can be dismissed without blocking reading', async ({ page }) => {
  await page.goto('/biblia/juan/3')
  await page.getByRole('button', { name: 'Ocultar ayuda de los versículos' }).click()
  await page.reload()
  await expect(page.locator('#verse-1')).toBeVisible()
  await expect(page.getByTestId('reader-action-hint')).toHaveCount(0)
})

test('the single reader return action restores its thematic route context', async ({ page }) => {
  await page.goto('/topics')
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Tengo miedo', exact: true }).click()
  const destination = page.url()
  await page.addInitScript((returnTo) => {
    if (location.pathname.startsWith('/biblia/')) history.replaceState({ ...history.state, usr: { returnTo, returnSource: 'topics' } }, '', location.href)
  }, new URL(destination).pathname + new URL(destination).search)
  await page.goto('/biblia/salmos/27')
  await expect(page).toHaveURL(/\/biblia\/salmos\/27/)
  const back = page.getByRole('button', { name: 'Volver a la guía', exact: true })
  await expect(back).toHaveCount(1)
  await back.click()
  await expect(page).toHaveURL(destination)
  await expect(page.getByRole('heading', { name: 'Tengo miedo', exact: true })).toBeVisible()
})
