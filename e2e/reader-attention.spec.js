import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ bibleVersion: 'nbla', locale: 'es', theme: 'light' }))
  })
})

test('the attention pulse expires after a delayed animation frame without removing a highlight', async ({ page }) => {
  await page.goto('/biblia/juan/3')
  const verse = page.locator('#verse-1')
  const actions = page.getByRole('dialog', { name: 'Acciones del versículo', exact: true })
  await verse.click()
  await actions.getByRole('button', { name: 'Guardar versículo', exact: true }).click()
  await expect(actions).toBeHidden()
  await verse.click()
  await actions.getByRole('button', { name: 'Destacar versículo', exact: true }).click()
  await expect(actions).toBeHidden()
  await expect(verse).toHaveClass(/is-highlighted/)
  await page.goto('/saved')
  const saved = page.locator('.saved-list').getByRole('link', { name: /Juan 3:1/ })
  await expect(saved).toBeVisible()

  await page.evaluate(() => {
    const frames = new Map()
    const request = window.requestAnimationFrame.bind(window)
    const cancel = window.cancelAnimationFrame.bind(window)
    let id = 1_000_000
    window.requestAnimationFrame = callback => { frames.set(++id, callback); return id }
    window.cancelAnimationFrame = frameId => { if (!frames.delete(frameId)) cancel(frameId) }
    window.__attentionFrameGate = {
      frames,
      release() {
        window.requestAnimationFrame = request
        window.cancelAnimationFrame = cancel
        const waiting = [...frames.values()]
        frames.clear()
        waiting.forEach(callback => callback(performance.now()))
      },
    }
  })

  try {
    // DOM activation does not wait for the deliberately paused frame callbacks.
    await saved.evaluate(link => link.click())
    await expect(page).toHaveURL(/\/biblia\/juan\/3\/1\?v=nbla$/)
    await expect(verse).toBeVisible()
    await expect.poll(() => page.evaluate(() => window.__attentionFrameGate.frames.size)).toBeGreaterThan(0)
    // Simulate a background tab: timers can run while animation frames pause.
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3100)))
    await expect(verse).not.toHaveClass(/is-attention-pulsing/)
    await page.evaluate(() => window.__attentionFrameGate.release())
    await expect(verse).toHaveClass(/is-attention-pulsing/)
    await expect(verse).not.toHaveClass(/is-attention-pulsing/, { timeout: 7000 })
    await expect(verse).toHaveClass(/is-highlighted/)
    await expect(verse).not.toHaveClass(/is-selected/)
  } finally {
    await page.evaluate(() => {
      window.__attentionFrameGate?.release()
      delete window.__attentionFrameGate
    })
  }
})

test('direct verse links without attention state do not receive a pulse', async ({ page }) => {
  await page.goto('/biblia/juan/3/1?v=nbla')
  const verse = page.locator('#verse-1')
  await expect(verse).toBeVisible()
  await expect(verse).not.toHaveClass(/is-attention-pulsing/, { timeout: 1000 })
  await expect(verse).toHaveAttribute('aria-pressed', 'false')
})
