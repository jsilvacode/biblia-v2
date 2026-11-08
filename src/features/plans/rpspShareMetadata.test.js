// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveRpspMetadata } from '../../../api/rpsp.js'
import { createRpspFallbackMetadata, loadRpspShareMetadata } from '../../../api/_lib/rpspShare.js'
import sharePage from '../../../api/share-page.js'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('../../../api/rpsp.js', () => ({ resolveRpspMetadata: vi.fn() }))

const origin = 'https://preview.santabiblia.cloud'
const date = '2026-11-08'
const episode = {
  title: 'El Señor reina | Salmo 93 | Reavivados por su Palabra',
  durationSeconds: 248,
}
const ready = { date, reference: { book: 19, chapter: 93 }, status: 'ready', episode }
const template = '<head><!-- share-meta:start --><!-- share-meta:end --></head><body><div id="root"></div></body>'

beforeEach(() => {
  vi.mocked(readFile).mockResolvedValue(template)
  vi.mocked(resolveRpspMetadata).mockReset()
})
afterEach(() => vi.useRealTimers())

describe('Reavivados share metadata', () => {
  it('identifies the real reflection, exact chapter and civil date in the preview', async () => {
    const resolveMetadata = vi.fn().mockResolvedValue(ready)
    const metadata = await loadRpspShareMetadata({ origin, date, resolveMetadata })
    expect(metadata).toMatchObject({
      canonicalUrl: `${origin}/reavivados/${date}`,
      contentDate: date,
      dateLabel: '8 de noviembre de 2026',
      episodeTitle: 'El Señor reina',
      reference: 'Salmos 93',
      audioDurationSeconds: 248,
      imageUrl: `${origin}/api/og-card?type=rpsp&date=${date}`,
      imageType: 'image/jpeg',
      imageWidth: 1200,
      imageHeight: 630,
      title: 'El Señor reina | Salmos 93 · Reavivados por su Palabra',
    })
    expect(metadata.description).toContain('8 de noviembre de 2026')
    expect(metadata.description).toContain('El Señor reina')
    expect(resolveMetadata).toHaveBeenCalledWith(expect.objectContaining({ date }))
  })

  it.each(['2026-02-30', 'invalid', '2027-01-01'])('rejects an invalid or unsupported date (%s) before calling the source', async (invalidDate) => {
    const resolver = vi.fn()
    await expect(loadRpspShareMetadata({ origin, date: invalidDate, resolveMetadata: resolver })).rejects.toThrow()
    expect(resolver).not.toHaveBeenCalled()
  })

  it.each([
    { ...ready, date: '2026-11-07' },
    { ...ready, reference: { book: 19, chapter: 94 } },
    { ...ready, episode: { ...episode, title: '' } },
  ])('rejects metadata that cannot identify the requested reflection', async (metadata) => {
    await expect(loadRpspShareMetadata({ origin, date, resolveMetadata: vi.fn().mockResolvedValue(metadata) })).rejects.toThrow('no es válida')
  })

  it.each(['pending', 'unavailable'])('does not turn %s audio into an authoritative preview', async (status) => {
    await expect(loadRpspShareMetadata({ origin, date, resolveMetadata: vi.fn().mockResolvedValue({ ...ready, status, episode: null }) })).rejects.toThrow('aún no está disponible')
  })

  it('bounds source resolution and aborts the fetch even if the resolver stalls', async () => {
    vi.useFakeTimers()
    let sourceSignal
    const fetchImpl = vi.fn((_url, options) => {
      sourceSignal = options.signal
      return new Promise(() => {})
    })
    const resolveMetadata = async ({ fetchImpl: request }) => {
      await request('https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/')
      return ready
    }
    const pending = loadRpspShareMetadata({ origin, date, fetchImpl, resolveMetadata })
    const assertion = expect(pending).rejects.toThrow('tardó demasiado')
    await vi.advanceTimersByTimeAsync(5000)
    await assertion
    expect(sourceSignal.aborted).toBe(true)
  })

  it('keeps the exact dated calendar identity in temporary fallback metadata', () => {
    const metadata = createRpspFallbackMetadata({ origin, date })
    expect(metadata.canonicalUrl).toBe(`${origin}/reavivados/${date}`)
    expect(metadata.title).toContain('Salmos 93')
    expect(metadata.description).toContain('8 de noviembre de 2026')
    expect(metadata.imageUrl).not.toContain('/api/og-card?type=rpsp')
  })
})

describe('Reavivados social HTML', () => {
  it('serves the dated SPA and escaped real-episode metadata on the request host', async () => {
    vi.mocked(resolveRpspMetadata).mockResolvedValue({ ...ready, episode: { ...episode, title: 'El Señor "reina" & nos <guarda>' } })
    const response = await sharePage.fetch(new Request(`https://internal.vercel.app/api/share-page?type=rpsp&date=${date}`, {
      headers: { 'x-forwarded-host': 'preview.santabiblia.cloud', 'x-forwarded-proto': 'https' },
    }))
    const html = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, s-maxage=900, stale-while-revalidate=3600')
    expect(html).toContain('<div id="root"></div>')
    expect(html).toContain(`<link rel="canonical" href="${origin}/reavivados/${date}" />`)
    expect(html).toContain('El Señor &quot;reina&quot; &amp; nos &lt;guarda&gt; | Salmos 93')
    expect(html).toContain(`${origin}/api/og-card?type=rpsp&amp;date=${date}`)
    expect(html).toContain('8 de noviembre de 2026')
  })

  it.each(['pending', 'unavailable'])('keeps the %s dated SPA without caching a provisional preview', async (status) => {
    vi.mocked(resolveRpspMetadata).mockResolvedValue({ ...ready, status, episode: null })
    const response = await sharePage.fetch(new Request(`${origin}/api/share-page?type=rpsp&date=${date}`))
    const html = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(html).toContain(`<link rel="canonical" href="${origin}/reavivados/${date}" />`)
    expect(html).toContain('Salmos 93')
    expect(html).not.toContain('/api/og-card?type=rpsp')
  })

  it('keeps the reading accessible if the audio source fails and supports HEAD', async () => {
    vi.mocked(resolveRpspMetadata).mockRejectedValue(new Error('Source unavailable'))
    const response = await sharePage.fetch(new Request(`${origin}/api/share-page?type=rpsp&date=${date}`, { method: 'HEAD' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toBe('')
  })
})
