import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const failures = window.__savedStorageFailures = { read: sessionStorage.getItem('saved-test-read-failure') ? 1 : 0, write: 0 }
    for (const [method, failure] of [['get', 'read'], ['put', 'write']]) {
      const original = IDBObjectStore.prototype[method]
      IDBObjectStore.prototype[method] = function (...args) {
        const request = original.apply(this, args)
        if (this.name === 'saved' && failures[failure] > 0) {
          failures[failure] -= 1
          queueMicrotask(() => this.transaction.abort())
        }
        return request
      }
    }
  })
})

test('failed writes stay visible and recover without saving the wrong verse', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/read/43/3/16')
  const actions = page.getByRole('dialog', { name: 'Acciones del versículo', exact: true })
  await page.locator('#verse-16').click()
  await page.evaluate(() => { window.__savedStorageFailures.write = 1 })
  await actions.getByRole('button', { name: 'Guardar versículo', exact: true }).click()
  await expect(actions.getByRole('alert')).toContainText('No se pudo guardar el cambio.')
  await expect(actions.getByRole('button', { name: 'Guardar versículo', exact: true })).toBeEnabled()
  await expect(actions.getByRole('button', { name: 'Guardar versículo', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('Versículo guardado.', { exact: true })).toHaveCount(0)
  await actions.getByRole('button', { name: 'Cerrar', exact: true }).click()
  await page.locator('#verse-17').click()
  await expect(actions.getByRole('alert')).toHaveCount(0)
  await page.evaluate(() => { window.__savedStorageFailures.write = 1 })
  await actions.getByRole('button', { name: 'Guardar versículo', exact: true }).click()
  await expect(actions.getByRole('alert')).toBeVisible()
  await actions.getByRole('button', { name: 'Intentar de nuevo', exact: true }).click()
  await expect(actions).toHaveCount(0)
  await page.goto('/saved')
  await expect(page.locator('.saved-list').getByRole('link', { name: /Juan 3:17/ })).toHaveAttribute('href', '/read/43/3/17?v=nbla')
  await expect(page.locator('.saved-list').getByRole('link')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.saved-list').getByRole('link', { name: /Juan 3:17/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('a failed read shows an error instead of an empty list and retry recovers existing verses', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/read/43/3/16')
  await page.locator('#verse-16').click()
  const actions = page.getByRole('dialog', { name: 'Acciones del versículo', exact: true })
  await actions.getByRole('button', { name: 'Guardar versículo', exact: true }).click()
  await expect(actions).toHaveCount(0)
  await page.evaluate(() => sessionStorage.setItem('saved-test-read-failure', 'once'))
  await page.goto('/saved')
  await expect(page.getByRole('alert')).toContainText('No pudimos cargar tus guardados.')
  await expect(page.getByText('Aún no has guardado versículos.', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Intentar de nuevo', exact: true }).click()
  await expect(page.locator('.saved-list').getByRole('link', { name: /Juan 3:16/ })).toHaveAttribute('href', '/read/43/3/16?v=nbla')
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(errors).toEqual([])
})
