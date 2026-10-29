import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Native selection coordinates must not move with the initial verse scroll.
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

async function letterPosition(page, selector, offset = 0) {
  return page.locator(selector).evaluate((element, start) => {
    const range = document.createRange()
    range.setStart(element.firstChild, start)
    range.setEnd(element.firstChild, start + 1)
    const box = range.getBoundingClientRect()
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }, offset)
}

test('native word selection and copy events do not open verse actions', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch readers use the explicit Copy verse action')
  await page.goto('/biblia/juan/3/16')
  await expect(page.locator('#verse-16')).toBeVisible()
  await page.evaluate(async () => { await document.fonts.ready })
  const point = await letterPosition(page, '#verse-16 span', 5)
  await page.mouse.dblclick(point.x, point.y)
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).not.toBe('')
  // Wait beyond a deferred single click to prove it cannot cover the selection.
  await page.waitForTimeout(400)
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const nativeActions = await page.locator('#verse-16').evaluate((element) => {
    // Synthetic events exercise cancellation without changing the OS clipboard.
    const contextMenu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    const copy = new ClipboardEvent('copy', { bubbles: true, cancelable: true })
    return {
      contextMenuAllowed: element.dispatchEvent(contextMenu),
      copyAllowed: element.dispatchEvent(copy),
      selection: window.getSelection().toString(),
    }
  })
  expect(nativeActions.contextMenuAllowed).toBe(true)
  expect(nativeActions.copyAllowed).toBe(true)
  expect(nativeActions.selection.trim()).not.toBe('')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('dragging a selection across verses preserves the selected text', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch readers use the explicit Copy verse action')
  await page.goto('/biblia/juan/3/16')
  await expect(page.locator('#verse-17')).toBeVisible()
  await page.evaluate(async () => { await document.fonts.ready })
  // Start inside a word, away from the leading punctuation and verse number.
  const start = await letterPosition(page, '#verse-16 span', 5)
  const end = await letterPosition(page, '#verse-17 span', 18)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 15 })
  await page.mouse.up()
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toMatch(/Dios/)
  await page.waitForTimeout(400)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('commentary text can be selected and its native context menu remains available', async ({ page }) => {
  await page.goto('/biblia/juan/3/16')
  await page.locator('#verse-16').click()
  await page.getByRole('button', { name: /Ver comentario bíblico|View Bible commentary|Ver comentário bíblico/ }).click()
  const commentary = page.locator('.reader-dialog--commentary .reader-dialog__scroll-area')
  await expect(commentary.locator('p:not(.reader-dialog__status)').first()).toBeVisible()
  const result = await commentary.evaluate((element) => {
    const paragraph = element.querySelector('p:not(.reader-dialog__status)')
    const range = document.createRange()
    range.selectNodeContents(paragraph)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    return {
      text: selection.toString(),
      userSelect: getComputedStyle(paragraph).userSelect,
      contextMenuAllowed: paragraph.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
    }
  })
  expect(result.text.trim()).not.toBe('')
  expect(result.userSelect).toBe('text')
  expect(result.contextMenuAllowed).toBe(true)
  await expect(page.getByRole('dialog')).toHaveCount(1)
})

test('Copy verse copies plain text with the reference using the explicit reader action', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text) => sessionStorage.setItem('copied-verse-text', text) },
    })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => { throw new Error('Copy should not invoke sharing') },
    })
  })
  await page.goto('/biblia/juan/3/16')
  const verse = page.locator('#verse-16')
  await expect(verse).toBeVisible()
  const text = await verse.locator('span').innerText()
  await verse.click()
  await page.getByRole('button', { name: /^(Copiar versículo|Copy verse)$/ }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.reader-action-feedback')).toContainText(/copiado|copied/)
  const copied = await page.evaluate(() => sessionStorage.getItem('copied-verse-text'))
  expect(copied).toBe(`Juan 3:16 · NBLA\n\n${text}`)
  expect(copied).not.toContain('https://')
})

test('mobile uses one tap and explicit Copy verse without a competing long-press menu', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'Touch interaction coverage')
  await page.goto('/biblia/juan/3/16')
  const verse = page.locator('#verse-16')
  await expect(verse).toBeVisible()
  await page.evaluate(async () => { await document.fonts.ready })
  const point = await letterPosition(page, '#verse-16 span', 5)
  const session = await context.newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
  await page.waitForTimeout(650)
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(400)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await verse.evaluate((element) => getComputedStyle(element).userSelect)).toBe('none')
  expect(await page.evaluate(() => window.getSelection().toString())).toBe('')
  expect(await verse.evaluate((element) => element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })))).toBe(false)

  await page.touchscreen.tap(point.x, point.y)
  await expect(page.getByRole('dialog').getByRole('button', { name: /^(Copiar versículo|Copy verse)$/ })).toBeVisible()
})
