// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveDailyVideoMetadata } from '../../../api/daily-video.js'
import {
  createDailyVideoFallbackMetadata,
  loadDailyVideoShareMetadata,
} from '../../../api/_lib/dailyVideoShare.js'
import sharePage from '../../../api/share-page.js'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('../../../api/daily-video.js', () => ({ resolveDailyVideoMetadata: vi.fn() }))

const origin = 'https://preview.santabiblia.cloud'
const date = '2026-10-19'
const episode = {
  contentDate: date,
  creator: 'Este Día con Dios',
  presenter: 'Pr. Jorge Rampogna',
  title: 'No depende solo de nosotros',
  videoId: 'PbyYEJDJFwg',
}
const template = '<head><!-- share-meta:start --><!-- share-meta:end --></head><body><div id="root"></div></body>'

beforeEach(() => {
  vi.mocked(readFile).mockResolvedValue(template)
  vi.mocked(resolveDailyVideoMetadata).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('daily video share metadata', () => {
  it('resolves one exact editorial date within the social preview budget', async () => {
    const resolver = vi.fn().mockResolvedValue({ status: 'ready', episode })
    const metadata = await loadDailyVideoShareMetadata({ origin, date, resolveMetadata: resolver })

    expect(metadata.canonicalUrl).toBe(`${origin}/este-dia-con-dios/${date}`)
    expect(metadata.title).toBe('No depende solo de nosotros | Este Día con Dios · Santa Biblia')
    expect(metadata.description).toContain('19 de octubre de 2026')
    expect(metadata.description).toContain('Pr. Jorge Rampogna')
    expect(metadata.imageUrl).toBe('https://i.ytimg.com/vi/PbyYEJDJFwg/hqdefault.jpg')
    expect(metadata.imageWidth).toBe(480)
    expect(metadata.imageHeight).toBe(360)
    expect(resolver).toHaveBeenCalledWith(expect.objectContaining({ date, timeoutMs: 3250 }))
  })

  it('rejects invalid dates and a resolver result for another date', async () => {
    const resolver = vi.fn().mockResolvedValue({ status: 'ready', episode: { ...episode, contentDate: '2026-10-18' } })
    await expect(loadDailyVideoShareMetadata({ origin, date: '2026-02-30', resolveMetadata: resolver })).rejects.toThrow('Fecha')
    expect(resolver).not.toHaveBeenCalled()
    await expect(loadDailyVideoShareMetadata({ origin, date, resolveMetadata: resolver })).rejects.toThrow('no es válida')
  })

  it('bounds a stalled resolver and cancels its source request', async () => {
    vi.useFakeTimers()
    let signal
    const resolver = vi.fn((options) => {
      signal = options.signal
      return new Promise(() => {})
    })
    const pending = loadDailyVideoShareMetadata({ origin, date, resolveMetadata: resolver })
    const assertion = expect(pending).rejects.toThrow('tardó demasiado')
    await vi.advanceTimersByTimeAsync(3500)
    await assertion
    expect(signal.aborted).toBe(true)
  })

  it('keeps the dated canonical URL in generic fallback metadata', () => {
    const metadata = createDailyVideoFallbackMetadata({ origin, date })
    expect(metadata.canonicalUrl).toBe(`${origin}/este-dia-con-dios/${date}`)
    expect(metadata.description).toContain('19 de octubre de 2026')
    expect(metadata.imageUrl).not.toContain('i.ytimg.com')
  })
})

describe('daily video social HTML', () => {
  it('serves the SPA and escaped episode tags for the request host', async () => {
    vi.mocked(resolveDailyVideoMetadata).mockResolvedValue({
      status: 'ready',
      episode: { ...episode, title: 'Camina "hoy" & confía <siempre>' },
    })
    const request = new Request(`https://internal.vercel.app/api/share-page?type=daily-video&date=${date}`, {
      headers: { 'x-forwarded-host': 'preview.santabiblia.cloud', 'x-forwarded-proto': 'https' },
    })
    const response = await sharePage.fetch(request)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, s-maxage=900, stale-while-revalidate=3600')
    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain(`<link rel="canonical" href="${origin}/este-dia-con-dios/${date}" />`)
    expect(html).toContain('Camina &quot;hoy&quot; &amp; confía &lt;siempre&gt; | Este Día con Dios · Santa Biblia')
    expect(html).toContain('https://i.ytimg.com/vi/PbyYEJDJFwg/hqdefault.jpg')
    expect(html).toContain('<meta property="og:image:width" content="480" />')
    expect(html).toContain('<meta property="og:image:height" content="360" />')
    expect(html).toContain('19 de octubre de 2026')
  })

  it.each(['pending', 'unavailable'])('does not cache a %s episode preview', async (status) => {
    vi.mocked(resolveDailyVideoMetadata).mockResolvedValue({ status, episode: null })
    const response = await sharePage.fetch(new Request(`${origin}/api/share-page?type=daily-video&date=${date}`))
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain(`<link rel="canonical" href="${origin}/este-dia-con-dios/${date}" />`)
    expect(html).not.toContain('i.ytimg.com')
  })

  it('keeps the dated SPA available when resolving metadata fails', async () => {
    vi.mocked(resolveDailyVideoMetadata).mockRejectedValue(new Error('Origen sin respuesta'))
    const response = await sharePage.fetch(new Request(`${origin}/api/share-page?type=daily-video&date=${date}`))
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toContain(`${origin}/este-dia-con-dios/${date}`)
  })
})
