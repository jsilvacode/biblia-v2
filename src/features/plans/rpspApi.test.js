import { describe, expect, it, vi } from 'vitest'
import { createRpspHandler, resetRpspMetadataMemory } from '../../../api/rpsp.js'
import { RPSP_RSS_URL, resetRpspFeedMemory } from '../../../api/_lib/rpspFeed.js'

const origin = 'https://www.santabiblia.cloud'
const sourcePageUrl = 'https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/gustad-y-ved-que-bueno-es-el-senor-salmo-34-reavivados-por-su-palabra/'
const audioUrl = 'https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3'

function feed(title = 'Gustad y ved que bueno es el Señor | Salmo 34 | Reavivados por su Palabra') {
  return `
    <rss version="2.0"><channel><item>
      <guid>38751</guid>
      <title><![CDATA[${title}]]></title>
      <link>${sourcePageUrl}</link>
      <pubDate>Thu, 10 Sep 2026 01:00:00 -0300</pubDate>
      <enclosure url="${audioUrl}" type="audio/mpeg" />
    </item></channel></rss>`
}

function handlerWith(fetchImpl, options = {}) {
  resetRpspFeedMemory()
  resetRpspMetadataMemory()
  return createRpspHandler({
    fetchImpl,
    now: () => new Date('2026-09-10T05:00:00.000Z'),
    fallbackEntries: [],
    ...options,
  })
}

describe('RPSP metadata endpoint', () => {
  it('serves verified feed metadata and never the audio itself', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url.includes('/wp-json/wp/v2/audio')) return new Response('[]', { status: 200 })
      expect(url).toBe(RPSP_RSS_URL)
      return new Response(feed(), { headers: { etag: '"rpsp"' }, status: 200 })
    })
    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/rpsp?date=2026-09-10`))

    expect(response.headers.get('cache-control')).toBe('public, s-maxage=900, stale-while-revalidate=3600')
    await expect(response.json()).resolves.toMatchObject({
      date: '2026-09-10',
      reference: { book: 19, chapter: 34 },
      status: 'ready',
      provenance: 'rss',
      episode: { audioUrl, sourcePageUrl },
    })
  })

  it('keeps the metadata contract available to HEAD without a response body', async () => {
    const response = await handlerWith(async () => new Response(feed(), { status: 200 }))(
      new Request(`${origin}/api/rpsp?date=2026-09-10`, { method: 'HEAD' }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
    await expect(response.text()).resolves.toBe('')
  })

  it('uses the bounded WordPress and page fallback when the RSS has no matching entry', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === RPSP_RSS_URL) return new Response(feed('Salmo 134'), { status: 200 })
      if (url.includes('/wp-json/wp/v2/audio')) {
        return new Response(JSON.stringify([{
          id: 38751,
          date: '2026-09-10T01:00:00',
          date_gmt: '2026-09-10T04:00:00',
          link: sourcePageUrl,
          title: { rendered: 'Gustad y ved que bueno es el Señor | Salmo 34 | Reavivados por su Palabra' },
        }]), { status: 200 })
      }
      if (url === sourcePageUrl) return new Response(`<audio src="${audioUrl}"></audio>`, { status: 200 })
      throw new Error(`Unexpected source ${url}`)
    })

    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/rpsp?date=2026-09-10`))
    await expect(response.json()).resolves.toMatchObject({ status: 'ready', provenance: 'wordpress', episode: { audioUrl } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reports pending when official sources are available but the day has not been published', async () => {
    const fetchMock = vi.fn(async (url) => {
      if (url === RPSP_RSS_URL) return new Response(feed('Salmo 134'), { status: 200 })
      return new Response('[]', { status: 200 })
    })

    const response = await handlerWith(fetchMock)(new Request(`${origin}/api/rpsp?date=2026-09-10`))
    expect(response.headers.get('cache-control')).toBe('public, s-maxage=120, stale-while-revalidate=120')
    await expect(response.json()).resolves.toMatchObject({ status: 'pending', episode: null })
  })

  it('uses an exact snapshot after both official sources fail and never substitutes another day', async () => {
    const snapshot = [{
      date: '2026-09-10',
      reference: { book: 19, chapter: 34 },
      episode: {
        id: '38751',
        title: 'Salmo 34',
        publishedAt: '2026-09-10T04:00:00.000Z',
        presenter: null,
        language: 'es',
        sourcePageUrl,
        audioUrl,
        mimeType: 'audio/mpeg',
        durationSeconds: null,
      },
    }]
    const unavailable = async () => { throw new Error('offline') }

    const matching = await handlerWith(unavailable, { fallbackEntries: snapshot })(new Request(`${origin}/api/rpsp?date=2026-09-10`))
    await expect(matching.json()).resolves.toMatchObject({ status: 'ready', provenance: 'snapshot', episode: { id: '38751' } })

    const anotherDay = await handlerWith(unavailable, { fallbackEntries: snapshot })(new Request(`${origin}/api/rpsp?date=2026-09-11`))
    await expect(anotherDay.json()).resolves.toMatchObject({ status: 'unavailable', episode: null })
  })

  it('keeps malformed and out-of-calendar dates distinct', async () => {
    const fetchMock = vi.fn()
    const handler = handlerWith(fetchMock)

    const malformed = await handler(new Request(`${origin}/api/rpsp?date=2026-02-29`))
    expect(malformed.status).toBe(400)
    await expect(malformed.json()).resolves.toEqual({ error: 'invalid_date' })

    const outOfCalendar = await handler(new Request(`${origin}/api/rpsp?date=2027-01-01`))
    await expect(outOfCalendar.json()).resolves.toMatchObject({ status: 'out_of_calendar', episode: null, reference: null })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
