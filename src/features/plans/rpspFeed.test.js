import { describe, expect, it, vi } from 'vitest'
import {
  RPSP_RSS_URL,
  extractRpspAudioUrl,
  fetchRpspDocument,
  findRpspFeedEpisode,
  getRpspFeed,
  resetRpspFeedMemory,
} from '../../../api/_lib/rpspFeed.js'

function item({ guid, title, audio = 'https://vod.nuevotiempo.org/ReavivadosA/reavivados.mp3' }) {
  return `
    <item>
      <guid>${guid}</guid>
      <title><![CDATA[${title}]]></title>
      <link>https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/${guid}/</link>
      <pubDate>Thu, 10 Sep 2026 01:00:00 -0300</pubDate>
      <enclosure url="${audio}" type="audio/mpeg" />
    </item>`
}

function feed(...items) {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${items.join('')}</channel></rss>`
}

describe('RPSP feed adapter', () => {
  it('selects the exact date, book and chapter instead of matching 134 as 34', () => {
    const xml = feed(
      item({ guid: 'salmo-134', title: 'Alabad al Señor | Salmo 134 | Reavivados por su Palabra' }),
      item({ guid: 'salmo-34', title: 'Gustad y ved que bueno es el Señor | Salmo 34 | Reavivados por su Palabra' }),
    )

    expect(findRpspFeedEpisode(xml, {
      date: '2026-09-10',
      reference: { book: 19, chapter: 34 },
    })).toMatchObject({
      id: 'salmo-34',
      declaredDate: '2026-09-10',
      audioUrl: 'https://vod.nuevotiempo.org/ReavivadosA/reavivados.mp3',
    })
  })

  it('rejects media and redirects outside the verified official hosts', async () => {
    expect(extractRpspAudioUrl('<audio src="https://example.test/episode.mp3"></audio>')).toBeNull()

    await expect(fetchRpspDocument(RPSP_RSS_URL, {
      fetchImpl: vi.fn(async () => new Response(null, {
        headers: { location: 'https://example.test/feed.xml' },
        status: 302,
      })),
    })).rejects.toThrow('Rejected RPSP redirect')
  })

  it('uses ETag validators without losing the last bounded feed document', async () => {
    resetRpspFeedMemory()
    const xml = feed(item({ guid: 'salmo-34', title: 'Salmo 34' }))
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(xml, { headers: { etag: '"rpsp-1"' }, status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 304 }))

    await expect(getRpspFeed({ fetchImpl: fetchMock })).resolves.toMatchObject({ text: xml })
    await expect(getRpspFeed({ fetchImpl: fetchMock })).resolves.toMatchObject({ text: xml })
    expect(fetchMock.mock.calls[1][1].headers).toMatchObject({ 'If-None-Match': '"rpsp-1"' })
  })
})
