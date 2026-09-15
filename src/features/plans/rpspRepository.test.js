import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRpspMetadata, resetRpspMetadataRepository } from './rpspRepository'

const metadata = {
  schemaVersion: 1,
  date: '2026-09-10',
  reference: { book: 19, chapter: 34 },
  status: 'ready',
  episode: {
    id: '38751',
    title: 'Salmo 34',
    publishedAt: '2026-09-10T04:00:00.000Z',
    presenter: null,
    language: 'es',
    sourcePageUrl: 'https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/salmo-34/',
    audioUrl: 'https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3',
    mimeType: 'audio/mpeg',
    durationSeconds: null,
  },
  checkedAt: '2026-09-10T05:00:00.000Z',
  provenance: 'rss',
}

describe('RPSP metadata repository', () => {
  afterEach(() => resetRpspMetadataRepository())

  it('shares a request for the same date and caches only validated metadata', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(metadata), { status: 200 }))
    const [first, second] = await Promise.all([
      loadRpspMetadata({ date: '2026-09-10', fetchImpl: fetchMock }),
      loadRpspMetadata({ date: '2026-09-10', fetchImpl: fetchMock }),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
    await expect(loadRpspMetadata({ date: '2026-09-10', fetchImpl: fetchMock })).resolves.toBe(first)
  })

  it('lets an abandoned caller abort without cancelling the shared metadata request', async () => {
    let finish
    const fetchMock = vi.fn(() => new Promise((resolve) => {
      finish = () => resolve(new Response(JSON.stringify(metadata), { status: 200 }))
    }))
    const controller = new AbortController()
    const abandoned = loadRpspMetadata({ date: '2026-09-10', fetchImpl: fetchMock, signal: controller.signal })
    const active = loadRpspMetadata({ date: '2026-09-10', fetchImpl: fetchMock })
    controller.abort()
    finish()

    await expect(abandoned).rejects.toMatchObject({ name: 'AbortError' })
    await expect(active).resolves.toMatchObject({ status: 'ready' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a response that changes the requested date or media host', async () => {
    const invalid = {
      ...metadata,
      date: '2026-09-11',
      episode: { ...metadata.episode, audioUrl: 'https://example.test/episode.mp3' },
    }
    await expect(loadRpspMetadata({
      date: '2026-09-10',
      fetchImpl: async () => new Response(JSON.stringify(invalid), { status: 200 }),
    })).rejects.toThrow('Invalid Reavivados metadata response')
  })
})
