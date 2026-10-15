import { expect, test } from '@playwright/test'

test('starts the chapter download while the reader module is still loading', async ({ page }) => {
  let releaseReader
  const readerGate = new Promise((resolve) => { releaseReader = resolve })
  let chapterRequested = false
  await page.route('**/src/features/reader/ReaderPage.jsx*', async (route) => {
    await readerGate
    await route.continue()
  })
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/data/kjv/43_juan/3.json') chapterRequested = true
  })

  try {
    await page.goto('/read/43/3/16?v=kjv', { waitUntil: 'domcontentloaded' })
    await expect.poll(() => chapterRequested).toBe(true)
    await expect(page.locator('[data-verse-number="16"]')).toHaveCount(0)
  } finally {
    releaseReader()
  }
  await expect(page.locator('[data-verse-number="16"]')).toContainText('For God so loved the world')
})
