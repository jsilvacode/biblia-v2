import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDailyVideoHandler, resolveDailyVideoMetadata } from '../../../api/daily-video.js'
import {
  createDailyVideoPostsUrl,
  extractDailyVideoId,
  fetchDailyVideoDocument,
  getDailyVideoHistoryStartDate,
  normalizeDailyVideoHistory,
  validateDailyVideoSourcePageUrl,
} from '../../../api/_lib/dailyVideoSource.js'
import verifiedSnapshot from './data/verified-videos.json'

const origin = 'https://www.santabiblia.cloud'
const date = '2026-10-19'
const videoId = 'PbyYEJDJFwg'
const sourcePageUrl = 'https://estediacondios.com/2026/10/19/292-no-depende-solo-de-nosotros-i-este-dia-con-dios-pr-jorge-rampogna/'

function post(overrides = {}) {
  return {
    id: 3202, date: `${date}T01:00:00`, link: sourcePageUrl,
    title: { rendered: '#292 No depende solo de nosotros I Este Día Con Dios &#8211; Pr. Jorge Rampogna' },
    content: { rendered: '' },
    ...overrides,
  }
}

function previousPosts(count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const day = String(18 - index).padStart(2, '0')
    return post({ id: 3400 + index, date: `2026-10-${day}T01:00:00`, link: `https://estediacondios.com/2026/10/${day}/capsula-${index}/` })
  })
}

function jsonResponse(value) {
  return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } })
}

function source({ posts = [post()], html = `<iframe src="https://www.youtube.com/embed/${videoId}?controls=0"></iframe>`, previous = [] } = {}) {
  return vi.fn(async (url) => {
    if (url === createDailyVideoPostsUrl(date)) return jsonResponse(posts)
    if (url === createDailyVideoPostsUrl(date, { history: true })) return jsonResponse(previous)
    if (url === sourcePageUrl) return new Response(html)
    throw new Error(`Unexpected source URL: ${url}`)
  })
}

function handlerWith(fetchImpl, options = {}) {
  return createDailyVideoHandler({
    fetchImpl, now: () => new Date('2026-10-19T02:00:00.000Z'), fallbackEntries: [], ...options,
  })
}

async function resolve(fetchImpl, options = {}) {
  return resolveDailyVideoMetadata({
    date, fetchImpl, now: () => new Date('2026-10-19T02:00:00.000Z'), fallbackEntries: [], ...options,
  })
}

afterEach(() => vi.useRealTimers())

describe('daily video metadata endpoint', () => {
  it('resolves the editorial date from WordPress and an iframe, without converting it to local time', async () => {
    const fetchMock = source()
    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/daily-video?date=${date}`))
    expect(response.headers.get('cache-control')).toBe('public, s-maxage=900, stale-while-revalidate=3600')
    await expect(response.json()).resolves.toEqual({
      schemaVersion: 1, date, status: 'ready', checkedAt: '2026-10-19T02:00:00.000Z', provenance: 'wordpress',
      episode: {
        contentDate: date, sourcePostId: 3202, episodeNumber: 292,
        title: 'No depende solo de nosotros', videoId, sourcePageUrl,
        presenter: 'Pr. Jorge Rampogna', creator: 'Este Día con Dios',
        channelUrl: 'https://www.youtube.com/@EsteDiaConDios', language: 'es',
      },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const query = new URL(fetchMock.mock.calls[0][0]).searchParams
    expect(query.get('after')).toBe(`${date}T00:00:00`)
    expect(query.get('before')).toBe(`${date}T23:59:59`)
    expect(query.get('_fields')).toBe('id,date,link,title')
  })

  it('keeps HEAD metadata headers with an empty body and rejects write methods', async () => {
    const handler = handlerWith(source())
    const head = await handler(new Request(`${origin}/api/daily-video?date=${date}`, { method: 'HEAD' }))
    expect(head.status).toBe(200)
    expect(head.headers.get('content-type')).toBe('application/json; charset=utf-8')
    await expect(head.text()).resolves.toBe('')
    const postResponse = await handler(new Request(`${origin}/api/daily-video?date=${date}`, { method: 'POST' }))
    expect(postResponse.status).toBe(405)
    expect(postResponse.headers.get('allow')).toBe('GET, HEAD')
  })

  it.each([
    ['', 'invalid_request'],
    ['?date=2026-02-29', 'invalid_date'],
    ['?date=2026-13-01', 'invalid_date'],
    ['?date=2026-10-19T01:00:00', 'invalid_date'],
    ['?date=2026-10-19&date=2026-10-18', 'invalid_request'],
    ['?date=2026-10-19&history=1&history=1', 'invalid_request'],
    ['?date=2026-10-19&history=0', 'invalid_request'],
    ['?date=2026-10-19&source=https://evil.example', 'invalid_request'],
  ])('rejects malformed or ambiguous query %s before consulting the provider', async (query, error) => {
    const fetchMock = vi.fn()
    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/daily-video${query}`))
    expect(response.status).toBe(400)
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ error })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports a missing publication as pending with a brief cache lifetime', async () => {
    const fetchMock = source({ posts: [] })
    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/daily-video?date=${date}`))
    expect(response.headers.get('cache-control')).toBe('public, s-maxage=120, stale-while-revalidate=120')
    await expect(response.json()).resolves.toMatchObject({ status: 'pending', episode: null, provenance: 'wordpress' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['duplicate publications', [post(), post({ id: 3300 })]],
    ['publication from another date', [post({ date: '2026-10-18T01:00:00' })]],
    ['permalink with another date', [post({ link: sourcePageUrl.replace('/10/19/', '/10/18/') })]],
    ['untrusted source host', [post({ link: sourcePageUrl.replace('estediacondios.com', 'evil.example') })]],
    ['invalid publication date', [post({ date: '2026-10-19T26:00:00' })]],
    ['malformed JSON shape', { error: 'wordpress unavailable' }],
  ])('keeps %s unavailable without choosing an arbitrary video', async (_, posts) => {
    const fetchMock = source({ posts })
    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/daily-video?date=${date}`))
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toMatchObject({ status: 'unavailable', episode: null })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('treats changed page markup and a provider outage as unavailable, not unpublished', async () => {
    await expect(resolve(source({ html: '<p>Temporarily unavailable</p>' }))).resolves.toMatchObject({ status: 'unavailable', episode: null })
    const offline = async () => { throw new Error('offline') }
    await expect(resolve(offline)).resolves.toMatchObject({ status: 'unavailable', episode: null, provenance: 'unavailable' })
  })

  it('allows future years and leap dates without deriving dates from episode numbers', async () => {
    const futureDate = '2028-02-29'
    const futurePage = 'https://estediacondios.com/2028/02/29/60-una-capsula/'
    const fetchMock = vi.fn(async (url) => {
      if (url === futurePage) return new Response(`<iframe src="https://www.youtube.com/embed/${videoId}"></iframe>`)
      expect(new URL(url).searchParams.get('after')).toBe(`${futureDate}T00:00:00`)
      return jsonResponse([post({ date: `${futureDate}T00:01:00`, link: futurePage, title: { rendered: '60 - Una cápsula' } })])
    })
    await expect(resolve(fetchMock, { date: futureDate })).resolves.toMatchObject({
      date: futureDate, status: 'ready', episode: { contentDate: futureDate, episodeNumber: 60, presenter: null },
    })
  })

  it('returns seven dated gallery entries with verified IDs from their individual pages', async () => {
    const previous = previousPosts()
    const base = source({ previous })
    const fetchMock = vi.fn(async (url, options) => {
      const index = previous.findIndex((entry) => entry.link === url)
      if (index >= 0) return new Response(`<iframe src="https://www.youtube.com/embed/history${String(index).padStart(4, '0')}"></iframe>`)
      return base(url, options)
    })
    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/daily-video?date=${date}&history=1`))
    const body = await response.json()
    expect(body.previous).toHaveLength(7)
    expect(body.historyStatus).toBe('ready')
    expect(body.previous[0]).toEqual({
      contentDate: '2026-10-18', sourcePostId: 3400, episodeNumber: 292,
      title: 'No depende solo de nosotros', sourcePageUrl: 'https://estediacondios.com/2026/10/18/capsula-0/',
      presenter: 'Pr. Jorge Rampogna',
      videoId: 'history0000',
    })
    expect(body.previous.map((entry) => entry.videoId)).toEqual(Array.from({ length: 7 }, (_, index) => `history${String(index).padStart(4, '0')}`))
    expect(fetchMock).toHaveBeenCalledTimes(10)
    const query = new URL(createDailyVideoPostsUrl(date, { history: true })).searchParams
    expect(query.get('after')).toBe('2026-10-12T00:00:00')
    expect(query.get('before')).toBe('2026-10-19T00:00:00')
  })

  it('keeps a failed thumbnail entry without replacing its date or losing the other videos', async () => {
    const previous = previousPosts(3)
    const base = source({ previous })
    const fetchMock = async (url, options) => {
      const index = previous.findIndex((entry) => entry.link === url)
      if (index === 1) return new Response('Unavailable', { status: 503 })
      if (index >= 0) return new Response(`<iframe src="https://www.youtube.com/embed/history${String(index).padStart(4, '0')}"></iframe>`)
      return base(url, options)
    }
    const result = await resolve(fetchMock, { history: true })
    expect(result.historyStatus).toBe('ready')
    expect(result.previous.map(({ contentDate, videoId: id }) => [contentDate, id])).toEqual([
      ['2026-10-18', 'history0000'], ['2026-10-17', null], ['2026-10-16', 'history0002'],
    ])
  })

  it('hydrates no more than three historical pages concurrently', async () => {
    vi.useFakeTimers()
    const previous = previousPosts()
    const base = source({ previous })
    let active = 0
    let maximum = 0
    const fetchMock = vi.fn(async (url, options) => {
      const index = previous.findIndex((entry) => entry.link === url)
      if (index < 0) return base(url, options)
      active += 1
      maximum = Math.max(maximum, active)
      await new Promise((done) => setTimeout(done, 20))
      active -= 1
      return new Response(`<iframe src="https://www.youtube.com/embed/history${String(index).padStart(4, '0')}"></iframe>`)
    })
    const pending = resolve(fetchMock, { history: true, timeoutMs: 500 })
    await vi.advanceTimersByTimeAsync(1)
    expect(active).toBe(3)
    await vi.advanceTimersByTimeAsync(60)
    const result = await pending
    expect(maximum).toBe(3)
    expect(result.previous.every((entry) => entry.videoId !== null)).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(10)
  })

  it('shares the global deadline with history hydration and preserves unverified entries on timeout', async () => {
    vi.useFakeTimers()
    const previous = previousPosts()
    const base = source({ previous })
    const cancelled = vi.fn()
    const fetchMock = vi.fn(async (url, options) => {
      if (previous.some((entry) => entry.link === url)) return new Response(new ReadableStream({ cancel: cancelled }))
      return base(url, options)
    })
    const pending = resolve(fetchMock, { history: true, timeoutMs: 40 })
    await vi.advanceTimersByTimeAsync(41)
    const result = await pending
    expect(result).toMatchObject({ status: 'ready', historyStatus: 'ready' })
    expect(result.previous).toHaveLength(7)
    expect(result.previous.every((entry) => entry.videoId === null)).toBe(true)
    expect(cancelled).toHaveBeenCalledTimes(3)
    // Current lookup, current HTML, history catalogue and just three in-flight
    // history pages. The remaining queue does not start after the deadline.
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('reuses pinned IDs without requesting those historical pages', async () => {
    const previous = verifiedSnapshot.entries.slice(1).map((entry) => post({
      id: entry.sourcePostId, date: `${entry.contentDate}T01:00:00`, link: entry.sourcePageUrl,
    }))
    const fetchMock = source({ previous })
    const result = await resolve(fetchMock, { history: true, fallbackEntries: verifiedSnapshot.entries })
    expect(result.previous.map((entry) => entry.videoId)).toEqual(['mJmZNM0AHzA', '-1l4aNoFduQ'])
    expect(result.previous.map((entry) => entry.presenter)).toEqual(['Pr. Jorge Rampogna', 'Pr. Jorge Rampogna'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('bounds the seven calendar days across year changes and leap years', () => {
    expect(getDailyVideoHistoryStartDate('2027-01-03')).toBe('2026-12-27')
    expect(getDailyVideoHistoryStartDate('2024-03-03')).toBe('2024-02-25')
    const entries = ['2026-12-26', '2026-12-27', '2027-01-02', '2027-01-03'].map((contentDate, index) => post({
      id: 4000 + index, date: `${contentDate}T01:00:00`, link: `https://estediacondios.com/${contentDate.replaceAll('-', '/')}/capsula/`,
    }))
    expect(normalizeDailyVideoHistory(entries, '2027-01-03').map((entry) => entry.contentDate)).toEqual(['2027-01-02', '2026-12-27'])
  })

  it('does not fill missing days with older snapshot episodes', async () => {
    const offline = async () => { throw new Error('source timeout') }
    await expect(resolve(offline, { date: '2026-10-27', history: true, fallbackEntries: verifiedSnapshot.entries })).resolves.toMatchObject({
      status: 'unavailable', previous: [], historyStatus: 'unavailable',
    })
  })

  it('removes duplicated history dates and never includes the requested date or a future date', () => {
    const previous = post({ date: '2026-10-18T01:00:00', link: sourcePageUrl.replace('/10/19/', '/10/18/') })
    expect(normalizeDailyVideoHistory([previous, { ...previous, id: 4000 }, post()], date)).toEqual([])
  })

  it('keeps an available video when the separate history request fails', async () => {
    const base = source()
    const fetchMock = async (url, options) => {
      if (url === createDailyVideoPostsUrl(date, { history: true })) throw new Error('history failed')
      return base(url, options)
    }
    await expect(resolve(fetchMock, { history: true })).resolves.toMatchObject({ status: 'ready', previous: [], historyStatus: 'unavailable' })
  })

  it('uses only an exact verified snapshot during outages and returns dated history', async () => {
    const offline = async () => { throw new Error('source timeout') }
    const matching = await resolve(offline, { fallbackEntries: verifiedSnapshot.entries, history: true })
    expect(matching).toMatchObject({ status: 'ready', provenance: 'snapshot', episode: { contentDate: date, videoId } })
    expect(matching.previous.map((entry) => entry.contentDate)).toEqual(['2026-10-18', '2026-10-17'])
    expect(matching.previous.map((entry) => entry.videoId)).toEqual(['mJmZNM0AHzA', '-1l4aNoFduQ'])
    expect(matching.historyStatus).toBe('snapshot')
    await expect(resolve(offline, { date: '2026-10-20', fallbackEntries: verifiedSnapshot.entries })).resolves.toMatchObject({
      status: 'unavailable', episode: null,
    })
  })

  it('pins a verified shared date if the official post silently changes the video association', async () => {
    const fetchMock = source({ html: '<iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>' })
    await expect(resolve(fetchMock, { fallbackEntries: verifiedSnapshot.entries })).resolves.toMatchObject({
      status: 'ready', provenance: 'snapshot', episode: { videoId },
    })
  })

  it('does not use invalid or conflicting snapshot entries as fallback evidence', async () => {
    const offline = async () => { throw new Error('offline') }
    const entry = verifiedSnapshot.entries[0]
    await expect(resolve(offline, { fallbackEntries: [entry, { ...entry, videoId: 'abcdefghijk' }] })).resolves.toMatchObject({ status: 'unavailable' })
    await expect(resolve(offline, { fallbackEntries: [{ ...entry, sourcePageUrl: sourcePageUrl.replace('estediacondios.com', 'evil.example') }] })).resolves.toMatchObject({ status: 'unavailable' })
  })

  it('bounds the full resolution including a response body that never finishes', async () => {
    vi.useFakeTimers()
    const cancelled = vi.fn()
    const pending = resolve(async () => new Response(new ReadableStream({ cancel: cancelled })), { timeoutMs: 40 })
    await vi.advanceTimersByTimeAsync(41)
    await expect(pending).resolves.toMatchObject({ status: 'unavailable', episode: null })
    expect(cancelled).toHaveBeenCalledTimes(1)
  })

  it('honors an already aborted caller without making network requests', async () => {
    const fetchMock = vi.fn()
    const controller = new AbortController()
    controller.abort()
    await expect(resolve(fetchMock, { signal: controller.signal })).resolves.toMatchObject({ status: 'unavailable' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('daily video source bounds', () => {
  it.each([
    sourcePageUrl.replace('https:', 'http:'),
    sourcePageUrl.replace('estediacondios.com', 'estediacondios.com.evil.example'),
    sourcePageUrl.replace('estediacondios.com', 'estediacondios.com:443'),
    sourcePageUrl.replace('estediacondios.com', 'name@estediacondios.com'),
    `${sourcePageUrl}?redirect=https://evil.example`,
    sourcePageUrl.replace('/10/19/', '/02/30/'),
    sourcePageUrl.replace('/2026/', '/2026/%2e%2e/2026/'),
  ])('rejects a noncanonical source URL %s', (url) => {
    expect(validateDailyVideoSourcePageUrl(url)).toBeNull()
  })

  it('extracts only a unique official YouTube embed ID from iframe sources', () => {
    expect(extractDailyVideoId(`<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&amp;controls=1"></iframe>`)).toBe(videoId)
    expect(extractDailyVideoId(`<iframe src="https://www.youtube.com/embed/${videoId}"></iframe><iframe src="https://www.youtube.com/embed/${videoId}"></iframe>`)).toBe(videoId)
    expect(extractDailyVideoId(`<a href="https://youtu.be/${videoId}">Video</a>`)).toBeNull()
    expect(extractDailyVideoId(`<iframe src="https://www.youtube.com.evil.example/embed/${videoId}"></iframe>`)).toBeNull()
    expect(extractDailyVideoId(`<iframe src="https://www.youtube.com/embed/${videoId}"></iframe><iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>`)).toBeNull()
    expect(extractDailyVideoId(`<script>const x='<iframe src="https://www.youtube.com/embed/${videoId}"></iframe>'</script>`)).toBeNull()
    expect(extractDailyVideoId(`<!-- <iframe src="https://www.youtube.com/embed/${videoId}"></iframe> -->`)).toBeNull()
  })

  it('rejects an unsafe redirect before fetching a second host', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://evil.example/private' } }))
    await expect(fetchDailyVideoDocument(sourcePageUrl, { fetchImpl: fetchMock })).rejects.toThrow('Rejected daily video source redirect')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('caps redirect chains', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 302, headers: { location: sourcePageUrl } }))
    await expect(fetchDailyVideoDocument(sourcePageUrl, { fetchImpl: fetchMock })).rejects.toThrow('Too many daily video source redirects')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('rejects oversized response headers and oversized streamed bodies', async () => {
    await expect(fetchDailyVideoDocument(sourcePageUrl, {
      fetchImpl: async () => new Response('small', { headers: { 'content-length': '1000001' } }),
    })).rejects.toThrow('size limit')
    await expect(fetchDailyVideoDocument(sourcePageUrl, {
      fetchImpl: async () => new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(500_000))
          controller.enqueue(new Uint8Array(500_001))
          controller.close()
        },
      })),
    })).rejects.toThrow('size limit')
  })
})
