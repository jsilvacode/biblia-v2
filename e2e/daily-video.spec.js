import { expect, test } from '@playwright/test'
import snapshot from '../src/features/daily-video/data/verified-videos.json' with { type: 'json' }

const today = snapshot.entries[0]
const region = (page) => page.getByRole('region', { name: 'Este Día con Dios', exact: true })
const gallery = (page) => region(page).getByRole('region', { name: 'Cápsulas de los siete días anteriores', exact: true })
const galleryTiles = (page) => gallery(page).getByRole('list').getByRole('button')
const previousWeek = [
  ...snapshot.entries.slice(1),
  ...[
    ['2026-10-16', '-RObqYNXW-s', 'Dios en el camino'],
    ['2026-10-15', 'mQScH90gZo4', 'Corazón generoso'],
    ['2026-10-14', 'RWqCTaN5KfU', 'Pasos afirmados por Dios'],
    ['2026-10-13', '_lgkWhipA3w', 'Guiados en el camino'],
    ['2026-10-12', '4BRn2E0ZOxI', 'Paz de quien ya venció'],
  ].map(([contentDate, videoId, title], index) => ({
    contentDate, videoId, title, sourcePostId: 4000 + index,
    sourcePageUrl: `https://estediacondios.com/${contentDate.replaceAll('-', '/')}/capsula-de-prueba/`,
  })),
]

async function mockCapsules(page, { pending = false } = {}) {
  await page.clock.setFixedTime(new Date('2026-10-19T12:00:00-03:00'))
  await page.addInitScript(() => {
    window.copiedCapsule = null
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copiedCapsule = text } } })
  })
  let waiting = pending
  await page.route('**/api/daily-video?*', async (route) => {
    const params = new URL(route.request().url()).searchParams
    const date = params.get('date')
    const episode = snapshot.entries.find((entry) => entry.contentDate === date)
    const history = params.get('history') === '1'
    await route.fulfill({ json: {
      schemaVersion: 1, date, status: !waiting && episode ? 'ready' : 'pending',
      episode: !waiting && episode ? episode : null,
      checkedAt: '2026-10-19T15:00:00Z', provenance: 'wordpress',
      ...(history ? {
        previous: previousWeek.filter((entry) => entry.contentDate < date), historyStatus: 'ready',
      } : {}),
    } })
  })
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html lang="es"><body>Reproductor de prueba de YouTube <button type="button">Pausar reproducción</button></body></html>' }))
  return () => { waiting = false }
}

async function expectInlineVideo(page, videoId) {
  const iframe = page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]')
  await expect(iframe).toHaveCount(1)
  await expect(iframe).toHaveAttribute('src', new RegExp(`/embed/${videoId}\\?`))
  const playerUrl = new URL(await iframe.getAttribute('src'))
  expect(playerUrl.searchParams.get('autoplay')).toBe('1')
  expect(playerUrl.searchParams.get('playsinline')).toBe('1')
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull()
  return iframe
}

async function closeTheater(page) {
  await page.getByRole('button', { name: 'Cerrar modo teatro', exact: true }).click()
  await expect(page.getByRole('dialog', { name: /^Modo teatro:/ })).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveAttribute('data-video-theater', 'true')
}

test('Home places the daily capsule between the opening and other resources, and loads only one player on demand', async ({ page }) => {
  await mockCapsules(page)
  await page.goto('/')
  const capsule = region(page)
  await expect(capsule.getByRole('heading', { name: today.title })).toBeVisible()
  await expect(capsule.locator('iframe')).toHaveCount(0)
  const placement = await capsule.evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
    openingBottom: document.querySelector('[data-testid="home-opening"]').getBoundingClientRect().bottom,
    nextTop: document.getElementById('home-editorial-heading').getBoundingClientRect().top,
  }))
  expect(placement.top).toBeGreaterThanOrEqual(placement.openingBottom)
  expect(placement.bottom).toBeLessThan(placement.nextTop)
  await capsule.getByRole('button', { name: `Reproducir: ${today.title}`, exact: true }).click()
  const iframe = page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]')
  await expect(iframe).toHaveCount(1)
  await expect(iframe).toHaveAttribute('src', new RegExp(`^https://www.youtube-nocookie.com/embed/${today.videoId}\\?`))
  await expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
  const bounds = await iframe.boundingBox()
  expect(bounds.width).toBeGreaterThanOrEqual(200)
  expect(bounds.height).toBeGreaterThanOrEqual(200)
  await closeTheater(page)
  await expect(capsule.getByRole('link', { name: 'Ver en YouTube' })).toHaveAttribute('href', `https://www.youtube.com/watch?v=${today.videoId}`)
})

test('playing a capsule opens a centered theater, locks the background and preserves playback on exit', async ({ page }) => {
  await mockCapsules(page)
  const playerRequests = []
  page.on('request', (request) => {
    if (request.url().startsWith('https://www.youtube-nocookie.com/embed/')) playerRequests.push(request.url())
  })
  await page.goto('/')
  const poster = region(page).getByRole('button', { name: `Reproducir: ${today.title}`, exact: true })
  await poster.scrollIntoViewIfNeeded()
  await poster.focus()
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const originalScroll = await page.evaluate(() => window.scrollY)
  const decorationOffsets = () => page.locator('[data-home-parallax]').evaluateAll((elements) => elements.map((element) => element.style.transform))
  const originalDecorationOffsets = await decorationOffsets()
  await poster.click()
  const theater = page.getByRole('dialog', { name: `Modo teatro: ${today.title}`, exact: true })
  await expect(theater).toBeVisible()
  await expect(theater).toHaveAttribute('data-phase', 'open')
  expect(await theater.evaluate((element) => element.matches(':modal'))).toBe(true)
  await expect(page.locator('html')).toHaveAttribute('data-video-theater', 'true')
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).position)).toBe('fixed')
  const iframe = await expectInlineVideo(page, today.videoId)
  const originalPlayer = await iframe.elementHandle()
  const viewport = page.viewportSize()
  await expect.poll(async () => {
    const box = await iframe.boundingBox()
    return Math.abs(box.x + box.width / 2 - viewport.width / 2)
  }).toBeLessThanOrEqual(2)
  const box = await iframe.boundingBox()
  expect(box.width).toBeGreaterThanOrEqual(Math.min(viewport.width * .85, viewport.height * 1.4))
  expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(.02)
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(2)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  await expect.poll(() => theater.evaluate((element) => {
    const channels = getComputedStyle(element, '::backdrop').backgroundColor.match(/[\d.]+/g).map(Number)
    return channels.length === 4 ? channels[3] : 1
  })).toBeGreaterThanOrEqual(.85)
  const close = theater.getByRole('button', { name: 'Cerrar modo teatro', exact: true })
  const closeBox = await close.boundingBox()
  expect(closeBox.y).toBeGreaterThanOrEqual(0)
  expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(viewport.height)

  await page.locator('.home-page a[href="/biblia"]').first().evaluate((element) => element.focus())
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement.closest('dialog')))).toBe(true)
  await close.focus()
  await page.keyboard.press('Tab')
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement.closest('dialog')))).toBe(true)
  const lockedScroll = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 500)
  expect(await page.evaluate(() => window.scrollY)).toBe(lockedScroll)

  await closeTheater(page)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(originalScroll, 0)
  await expect.poll(decorationOffsets).toEqual(originalDecorationOffsets)
  expect(await iframe.evaluate((element, original) => element === original, originalPlayer)).toBe(true)
  const reopen = region(page).getByRole('button', { name: 'Modo teatro', exact: true })
  await expect(reopen).toBeFocused()
  await reopen.click()
  await expect(theater).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(theater).toHaveCount(0)
  expect(await iframe.evaluate((element, original) => element === original, originalPlayer)).toBe(true)
  expect(playerRequests).toHaveLength(1)
})

test('theater remains usable with reduced motion and restores the page after closing', async ({ page }) => {
  await mockCapsules(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/')
  await gallery(page).scrollIntoViewIfNeeded()
  await galleryTiles(page).first().click()
  const theater = page.getByRole('dialog', { name: 'Modo teatro: Separados para representar', exact: true })
  await expect(theater).toBeVisible()
  const iframe = await expectInlineVideo(page, snapshot.entries[1].videoId)
  const originalPlayer = await iframe.elementHandle()
  const box = await iframe.boundingBox()
  expect(box.width).toBeGreaterThanOrEqual(200)
  expect(box.height).toBeGreaterThanOrEqual(200)
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(320)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(900)
  await expect.poll(() => theater.evaluate((element) => element.getAnimations({ subtree: true })
    .filter((animation) => animation.playState === 'running')
    .map((animation) => ({
      type: animation.constructor.name,
      name: animation.animationName,
      property: animation.transitionProperty,
      target: animation.effect?.target?.tagName,
      properties: [...new Set(animation.effect?.getKeyframes().flatMap((frame) => Object.keys(frame)))],
    })))).toEqual([])
  await closeTheater(page)
  await expect(galleryTiles(page).first()).toHaveAttribute('aria-pressed', 'true')
  await galleryTiles(page).first().click()
  await expect(theater).toBeVisible()
  expect(await iframe.evaluate((element, original) => element === original, originalPlayer)).toBe(true)
  await closeTheater(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('previous videos retain their own date and shared link after the next day', async ({ page }) => {
  await mockCapsules(page)
  await page.goto('/')
  const capsule = region(page)
  await expect(capsule.getByRole('heading', { name: today.title })).toBeVisible()
  await gallery(page).scrollIntoViewIfNeeded()
  const selected = galleryTiles(page).filter({ has: page.locator('time[datetime="2026-10-18"]') })
  await expect(selected).toHaveAccessibleName(/18 de octubre de 2026.*Separados para representar/)
  await selected.click()
  await expect(page).toHaveURL('/')
  await expectInlineVideo(page, snapshot.entries[1].videoId)
  await closeTheater(page)
  await expect(region(page).getByRole('heading', { name: 'Separados para representar' })).toBeVisible()
  await expect(selected).toHaveAttribute('aria-pressed', 'true')
  await region(page).getByRole('button', { name: 'Compartir cápsula' }).click()
  await expect(region(page).getByText('Enlace copiado', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.copiedCapsule)).toBe(new URL('/este-dia-con-dios/2026-10-18', page.url()).href)
  await page.goto('/este-dia-con-dios/2026-10-18')
  await expect(region(page).getByRole('heading', { name: 'Separados para representar' })).toBeVisible()
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00-03:00'))
  await page.reload()
  await expect(page).toHaveURL('/este-dia-con-dios/2026-10-18')
  await expect(region(page).getByRole('heading', { name: 'Separados para representar' })).toBeVisible()
  await expect(region(page).getByRole('link', { name: 'Sitio oficial' })).toHaveAttribute('href', snapshot.entries[1].sourcePageUrl)
})

test('pending publication can be retried without substituting another date', async ({ page }) => {
  const publish = await mockCapsules(page, { pending: true })
  await page.goto('/este-dia-con-dios/2026-10-19')
  const capsule = region(page)
  await expect(capsule.getByText('La cápsula de esta fecha aún no está disponible.')).toBeVisible()
  await expect(capsule.locator('iframe')).toHaveCount(0)
  await expect(capsule.getByRole('button', { name: 'Compartir cápsula' })).toHaveCount(0)
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => document.documentElement.dataset.theme = value, theme)
    await page.setViewportSize({ width: 320, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  publish()
  await capsule.getByRole('button', { name: 'Intentar de nuevo' }).click()
  await expect(capsule.getByRole('heading', { name: today.title })).toBeVisible()
})

test('invalid date does not load a capsule or offer sharing', async ({ page }) => {
  await mockCapsules(page)
  const apiRequests = []
  page.on('request', (request) => { if (request.url().includes('/api/daily-video')) apiRequests.push(request.url()) })
  await page.goto('/este-dia-con-dios/2026-02-29')
  await expect(region(page).getByText('La fecha de esta cápsula no es válida.')).toBeVisible()
  await expect(region(page).locator('iframe')).toHaveCount(0)
  expect(apiRequests).toEqual([])
})

test('capsule fits narrow mobile, tablet and desktop in both themes', async ({ page }) => {
  await mockCapsules(page)
  await page.goto('/')
  await expect(region(page).getByRole('heading', { name: today.title })).toBeVisible()
  await expect(region(page).getByText('Un momento de fe para acompañar tu día.', { exact: true })).toHaveCount(0)
  await gallery(page).scrollIntoViewIfNeeded()
  await expect(galleryTiles(page)).toHaveCount(7)
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => document.documentElement.dataset.theme = value, theme)
    for (const width of [320, 390, 768, 1000, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const poster = region(page).getByRole('button', { name: `Reproducir: ${today.title}` })
      const bounds = await poster.boundingBox()
      expect(bounds.width).toBeGreaterThanOrEqual(200)
      expect(bounds.height).toBeGreaterThanOrEqual(200)
      if (bounds.width >= 356) expect(Math.abs(bounds.width / bounds.height - 16 / 9)).toBeLessThan(.02)
      const thumbnail = await galleryTiles(page).first().locator('img').boundingBox()
      const editorialCard = await page.getByRole('region', { name: 'También en Santa Biblia', exact: true }).getByRole('link').first().boundingBox()
      expect(thumbnail.width).toBeLessThanOrEqual(editorialCard.width / 2)
      await expect(gallery(page).getByRole('heading', { name: 'Videos anteriores', exact: true })).toBeVisible()
      const previousBounds = await gallery(page).boundingBox()
      const bodyBounds = await region(page).locator(':scope > [aria-busy]').boundingBox()
      const gap = previousBounds.y - (bodyBounds.y + bodyBounds.height)
      expect(gap).toBeGreaterThanOrEqual(0)
      expect(gap, `${theme}, ${width}px: gallery follows the player and its episode details`).toBeLessThanOrEqual(48)
      const credit = region(page).locator('footer')
      await expect(credit.getByText('Contenido de', { exact: true })).toBeVisible()
      const creditBounds = await credit.boundingBox()
      expect(creditBounds.y, `${theme}, ${width}px: attribution follows all videos`).toBeGreaterThanOrEqual(previousBounds.y + previousBounds.height)
    }
  }
})

test('loading the capsule keeps the following editorial section in place', async ({ page }) => {
  await mockCapsules(page)
  const originalViewport = page.viewportSize()
  let release
  const gate = new Promise((resolve) => { release = resolve })
  await page.route('**/api/daily-video?*', async (route) => { await gate; await route.fallback() })
  await page.goto('/')
  await expect(region(page).locator('[aria-busy="true"] p').filter({ hasText: /^Preparando la cápsula…$/ }).first()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Promesa del día', exact: true })).toHaveAttribute('aria-busy', 'false')
  await page.evaluate(() => document.fonts.ready)
  const originalTheme = await page.locator('html').getAttribute('data-theme')
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => document.documentElement.dataset.theme = value, theme)
    await page.setViewportSize({ width: 320, height: originalViewport.height })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.setViewportSize(originalViewport)
  await page.evaluate((value) => document.documentElement.dataset.theme = value, originalTheme)
  const top = () => page.locator('#home-editorial-heading').evaluate((element) => element.getBoundingClientRect().top)
  const loadingTop = await top()
  release()
  await expect(region(page).getByRole('heading', { name: today.title })).toBeVisible()
  expect(Math.abs(await top() - loadingTop)).toBeLessThanOrEqual(1)
})

test('the previous week is a manual thumbnail carousel below the player', async ({ page }) => {
  await mockCapsules(page)
  await page.goto('/este-dia-con-dios/2026-10-19')
  await expect(region(page).getByRole('heading', { name: today.title })).toBeVisible()
  const previous = gallery(page)
  await previous.scrollIntoViewIfNeeded()
  const tiles = galleryTiles(page)
  await expect(tiles).toHaveCount(7)
  await expect(tiles.locator('img')).toHaveCount(7)
  await expect(tiles.first().locator('img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/mJmZNM0AHzA/hqdefault.jpg')
  const thumbnail = await tiles.first().locator('img').evaluate((image) => ({
    imageHeight: image.getBoundingClientRect().height,
    frameHeight: image.parentElement.getBoundingClientRect().height,
    frameWidth: image.parentElement.getBoundingClientRect().width,
  }))
  expect(Math.abs(thumbnail.imageHeight - thumbnail.frameHeight)).toBeLessThanOrEqual(1)
  expect(Math.abs(thumbnail.frameWidth / thumbnail.frameHeight - 16 / 9)).toBeLessThan(.02)
  expect(await previous.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThan(
    await region(page).getByRole('button', { name: `Reproducir: ${today.title}` }).evaluate((element) => element.getBoundingClientRect().bottom),
  )
  const track = previous.getByRole('list')
  const initial = await track.evaluate((element) => ({ left: element.scrollLeft, width: element.clientWidth, total: element.scrollWidth }))
  expect(initial.total).toBeGreaterThan(initial.width)
  const previousControl = previous.getByRole('button', { name: 'Ver videos anteriores', exact: true })
  await expect(previousControl).toBeDisabled()
  const previousControlBounds = await previousControl.boundingBox()
  await page.mouse.click(previousControlBounds.x + previousControlBounds.width / 2, previousControlBounds.y + previousControlBounds.height / 2)
  await expect(region(page).locator('iframe')).toHaveCount(0)
  await expect(track.locator('button[aria-pressed="true"]')).toHaveCount(0)
  await expect(region(page).getByRole('heading', { name: today.title })).toBeVisible()
  await expect(page).toHaveURL('/este-dia-con-dios/2026-10-19')
  await previous.getByRole('button', { name: 'Ver más videos', exact: true }).click()
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(initial.left)
  await expect(previous.getByRole('button', { name: 'Ver videos anteriores', exact: true })).toBeEnabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(region(page).locator('iframe')).toHaveCount(0)
  const posterBounds = await region(page).getByRole('button', { name: `Reproducir: ${today.title}` }).boundingBox()
  const last = tiles.last()
  await expect(last).toHaveAccessibleName(/12 de octubre de 2026.*Paz de quien ya venció/)
  await last.focus()
  await expect(last).toBeInViewport()
  await last.press('Enter')
  await expect(page).toHaveURL('/este-dia-con-dios/2026-10-19')
  const iframe = await expectInlineVideo(page, '4BRn2E0ZOxI')
  await closeTheater(page)
  const playerBounds = await iframe.boundingBox()
  expect(Math.abs(playerBounds.width - posterBounds.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(playerBounds.height - posterBounds.height)).toBeLessThanOrEqual(1)
  await expect(last).toHaveAttribute('aria-pressed', 'true')
})
