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
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html lang="es"><body>Reproductor de prueba de YouTube</body></html>' }))
  return () => { waiting = false }
}

async function expectInlineVideo(page, videoId) {
  const iframe = region(page).locator('iframe')
  await expect(iframe).toHaveCount(1)
  await expect(iframe).toHaveAttribute('src', new RegExp(`/embed/${videoId}\\?`))
  const playerUrl = new URL(await iframe.getAttribute('src'))
  expect(playerUrl.searchParams.get('autoplay')).toBe('1')
  expect(playerUrl.searchParams.get('playsinline')).toBe('1')
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull()
  return iframe
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
  const iframe = capsule.locator('iframe')
  await expect(iframe).toHaveCount(1)
  await expect(iframe).toHaveAttribute('src', new RegExp(`^https://www.youtube-nocookie.com/embed/${today.videoId}\\?`))
  await expect(iframe).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
  const bounds = await iframe.boundingBox()
  expect(bounds.width).toBeGreaterThanOrEqual(200)
  expect(bounds.height).toBeGreaterThanOrEqual(200)
  await expect(capsule.getByRole('link', { name: 'Ver en YouTube' })).toHaveAttribute('href', `https://www.youtube.com/watch?v=${today.videoId}`)
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
  await expect(region(page).getByRole('heading', { name: 'Separados para representar' })).toBeVisible()
  await expectInlineVideo(page, snapshot.entries[1].videoId)
  await expect(selected).toHaveAttribute('aria-pressed', 'true')
  await region(page).getByRole('button', { name: 'Compartir cápsula' }).click()
  await expect(region(page).getByText('Enlace copiado', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.copiedCapsule)).toBe('http://127.0.0.1:4176/este-dia-con-dios/2026-10-18')
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
      const thumbnail = await galleryTiles(page).first().locator('img').boundingBox()
      const editorialCard = await page.getByRole('region', { name: 'También en Santa Biblia', exact: true }).getByRole('link').first().boundingBox()
      expect(thumbnail.width).toBeLessThanOrEqual(editorialCard.width / 2)
      const gap = thumbnail.y - (bounds.y + bounds.height)
      expect(gap).toBeGreaterThanOrEqual(0)
      expect(gap).toBeLessThanOrEqual(12)
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
  const playerBounds = await iframe.boundingBox()
  expect(Math.abs(playerBounds.width - posterBounds.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(playerBounds.height - posterBounds.height)).toBeLessThanOrEqual(1)
  await expect(last).toHaveAttribute('aria-pressed', 'true')
})
