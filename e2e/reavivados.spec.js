import { expect, test } from '@playwright/test'

const sequence = [
  [9, 24, 31], [10, 1, 24], [11, 1, 22], [12, 1, 25], [13, 1, 29],
  [14, 1, 36], [15, 1, 10], [16, 1, 13], [17, 1, 10], [18, 1, 42], [19, 1, 146],
]

function readingForDate(date) {
  const [year, month, day] = date.split('-').map(Number)
  let remaining = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000)
  for (const [book, from, to] of sequence) {
    const length = to - from + 1
    if (remaining < length) return { book, chapter: from + remaining }
    remaining -= length
  }
  throw new Error(`No Reavivados reading for ${date}`)
}

function metadataFor(date) {
  const reference = readingForDate(date)
  return {
    checkedAt: '2026-09-15T15:00:00.000Z',
    date,
    episode: {
      audioUrl: 'https://vod.nuevotiempo.org/ReavivadosA/Reavivados15-09-2026.mp3',
      durationSeconds: null,
      id: `rpsp-${date}`,
      language: 'es',
      mimeType: 'audio/mpeg',
      presenter: null,
      publishedAt: '2026-09-15T12:00:00.000Z',
      sourcePageUrl: 'https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/reavivados-prueba/',
      title: 'Reavivados por su Palabra',
    },
    provenance: 'test',
    reference,
    schemaVersion: 1,
    status: 'ready',
  }
}

test('Reavivados combines one day, one player and one chapter without duplicating the app shell', async ({ page }, testInfo) => {
  let requestedDate = null
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve()
  })
  await page.route('**/api/rpsp?date=*', async (route) => {
    requestedDate = new URL(route.request().url()).searchParams.get('date')
    await route.fulfill({ contentType: 'application/json', json: metadataFor(requestedDate) })
  })

  await page.goto('/reavivados')
  await expect.poll(() => requestedDate).not.toBeNull()
  const reference = readingForDate(requestedDate)

  await expect(page.locator('.site-header')).toHaveCount(1)
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
  await expect(page.locator('.mobile-navigation')).toHaveCount(1)
  await expect(page.locator('.reader-header')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: new RegExp(` ${reference.chapter}$`) }).last()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reavivados por su Palabra' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver fuente' })).toHaveAttribute('href', /nuevotiempo\.org\/audio\//)
  await expect(page.getByRole('button', { name: 'Reproducir reflexión' })).toBeVisible()

  const player = page.getByLabel('Reflexión del día')
  await expect(player.getByRole('heading', { name: 'Reavivados por su Palabra' })).toBeVisible()
  await expect(player.getByRole('button', { name: 'Activar reproducción en bucle' })).toBeVisible()
  await player.getByRole('button', { name: 'Abrir control de volumen' }).click()
  await expect(player.getByRole('slider', { name: 'Volumen' })).toBeVisible()
  const audio = page.locator('audio')
  await expect(audio).toHaveAttribute('preload', 'none')
  await expect(audio).not.toHaveAttribute('src')
  await page.getByRole('button', { name: 'Reproducir reflexión' }).click()
  await expect(audio).toHaveAttribute('src', /vod\.nuevotiempo\.org/)
  await audio.evaluate((element) => element.dispatchEvent(new Event('playing')))
  await expect(page.getByRole('button', { name: 'Pausar reflexión' })).toBeVisible()

  await expect.poll(() => page.evaluate(() => {
    const value = window.localStorage.getItem('santa_biblia_v2_rpsp')
    return value ? JSON.parse(value) : null
  })).toMatchObject({
    date: requestedDate,
    reference,
    schemaVersion: 1,
  })

  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('.mobile-navigation').getByRole('link')).toHaveCount(4)
  }
})

test('the chapter remains readable when the audio is not available', async ({ page }) => {
  await page.route('**/api/rpsp?date=*', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')
    const { reference } = metadataFor(date)
    await route.fulfill({
      contentType: 'application/json',
      json: { checkedAt: '2026-09-15T15:00:00.000Z', date, episode: null, provenance: 'test', reference, schemaVersion: 1, status: 'pending' },
    })
  })

  await page.goto('/reavivados')
  await expect(page.getByText('El audio de hoy aún no está disponible. Puedes comenzar con la lectura.')).toBeVisible()
  await expect(page.locator('[data-rpsp-verse]').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Compartir cápsula', exact: true })).toHaveCount(0)
})

test('a shared audio capsule preserves its date, chapter and link on the following day', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-08T12:00:00-03:00'))
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { window.copiedRpsp = text } } })
  })
  const requestedDates = []
  await page.route('**/api/rpsp?date=*', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')
    requestedDates.push(date)
    const metadata = metadataFor(date)
    metadata.episode.title = 'La majestad de Jehová | Salmo 93 | Reavivados por su Palabra'
    await route.fulfill({ json: metadata })
  })
  await page.goto('/reavivados/2026-11-08')
  const share = page.getByRole('button', { name: 'Compartir cápsula', exact: true })
  await expect(share).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Salmos 93', exact: true }).first()).toBeVisible()
  await expect(page.locator('audio')).not.toHaveAttribute('src')
  await share.click()
  await expect(page.getByText('Enlace copiado', { exact: true })).toBeVisible()
  const sharedUrl = new URL('/reavivados/2026-11-08', page.url()).href
  await expect.poll(() => page.evaluate(() => window.copiedRpsp)).toBe(sharedUrl)
  await page.clock.setFixedTime(new Date('2026-11-09T12:00:00-03:00'))
  await page.reload()
  await expect(share).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Salmos 93', exact: true }).first()).toBeVisible()
  expect(requestedDates.every(date => date === '2026-11-08')).toBe(true)
  await share.click()
  await expect.poll(() => page.evaluate(() => window.copiedRpsp)).toBe(sharedUrl)
  await expect(page.locator('audio')).not.toHaveAttribute('src')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('link', { name: 'Ir a la cápsula de hoy', exact: true }).click()
  await expect(page).toHaveURL(/\/reavivados$/)
  await expect.poll(() => requestedDates.at(-1)).toBe('2026-11-09')
})

test('an invalid shared capsule date does not request or share another audio', async ({ page }) => {
  let requests = 0
  await page.route('**/api/rpsp?date=*', route => { requests += 1; return route.abort() })
  await page.goto('/reavivados/2026-02-29')
  await expect(page.getByRole('heading', { name: 'La fecha de esta cápsula no es válida.', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Compartir cápsula', exact: true })).toHaveCount(0)
  expect(requests).toBe(0)
})

test('opening Reavivados starts from its header even when daily progress exists', async ({ page }) => {
  let requestedDate = null
  await page.route('**/api/rpsp?date=*', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')
    requestedDate = date
    await route.fulfill({ contentType: 'application/json', json: metadataFor(date) })
  })

  await page.goto('/reavivados')
  await expect.poll(() => requestedDate).not.toBeNull()
  const reference = readingForDate(requestedDate)
  await expect(page.locator('[data-rpsp-verse]').first()).toBeVisible()
  await page.evaluate(() => {
    const key = 'santa_biblia_v2_rpsp'
    const progress = JSON.parse(window.localStorage.getItem(key))
    window.localStorage.setItem(key, JSON.stringify({ ...progress, verse: 12, scrollProgress: 74 }))
  })

  await page.reload()
  await expect(page.getByRole('heading', { name: new RegExp(` ${reference.chapter}$`) }).first()).toBeVisible()
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0)
  await expect.poll(() => page.locator('[data-rpsp-verse]').first().evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
})

test('Reavivados keeps the global navigation fixed on compact screens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The compact global navigation is not rendered on desktop.')
  await page.route('**/api/rpsp?date=*', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')
    await route.fulfill({ contentType: 'application/json', json: metadataFor(date) })
  })

  await page.goto('/reavivados')
  const navigation = page.locator('.mobile-navigation')
  await expect(navigation).toHaveCSS('visibility', 'visible')
  await page.waitForTimeout(3400)
  await expect(navigation).toHaveCSS('visibility', 'visible')

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)).toBe(true)
  await page.waitForTimeout(3400)
  await expect(navigation).toHaveCSS('visibility', 'visible')
})

test('a chapter error has its own retry and does not hide the audio state', async ({ page }) => {
  const chapterData = /\/data\/(?:nbla|rva2015|kjv)\//u
  await page.route('**/api/rpsp?date=*', async (route) => {
    const date = new URL(route.request().url()).searchParams.get('date')
    const { reference } = metadataFor(date)
    await route.fulfill({
      contentType: 'application/json',
      json: { checkedAt: '2026-09-15T15:00:00.000Z', date, episode: null, provenance: 'test', reference, schemaVersion: 1, status: 'pending' },
    })
  })
  await page.route(chapterData, (route) => route.fulfill({ status: 500 }))

  await page.goto('/reavivados')
  await expect(page.getByText(/No fue posible cargar este capítulo|This chapter could not be loaded|Não foi possível carregar este capítulo/)).toBeVisible()
  await expect(page.getByText('El audio de hoy aún no está disponible. Puedes comenzar con la lectura.')).toBeVisible()

  await page.unroute(chapterData)
  await page.getByRole('button', { name: /Intentar de nuevo|Try again|Tentar novamente/ }).click()
  await expect(page.locator('[data-rpsp-verse]').first()).toBeVisible()
})
