// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import ogCard from '../../../api/og-card.js'
import { ShareMetadataError } from '../../../api/_lib/shareMetadata.js'
import { loadRpspShareMetadata } from '../../../api/_lib/rpspShare.js'

vi.mock('../../../api/_lib/rpspShare.js', () => ({ loadRpspShareMetadata: vi.fn() }))

const origin = 'https://www.santabiblia.cloud'
const cardUrl = `${origin}/api/og-card?type=rpsp&date=2026-11-08`
const metadata = {
  contentDate: '2026-11-08',
  dateLabel: '8 de noviembre de 2026',
  episodeTitle: 'Alabemos al Dios que nos prueba y nos salva | Salmos 93 | Reavivados por su Palabra',
  reference: 'Salmos 93',
  audioDurationSeconds: 615,
}

beforeEach(() => {
  vi.mocked(loadRpspShareMetadata).mockResolvedValue(metadata)
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('The card must never download audio.') }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(loadRpspShareMetadata).mockReset()
})

describe('Reavivados audio social card', () => {
  it('renders a complete lightweight 1200×630 JPEG for the selected date without downloading audio', async () => {
    const response = await ogCard.fetch(new Request(cardUrl))
    const bytes = Buffer.from(await response.arrayBuffer())
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(Number(response.headers.get('content-length'))).toBe(bytes.length)
    expect(response.headers.get('cache-control')).toContain('s-maxage=900')
    expect(response.headers.get('cache-control')).not.toContain('immutable')
    expect(await sharp(bytes).metadata()).toMatchObject({ width: 1200, height: 630, format: 'jpeg', hasAlpha: false, isProgressive: false })
    expect(bytes.length).toBeLessThan(200_000)
    expect(loadRpspShareMetadata).toHaveBeenCalledWith({ origin, date: '2026-11-08' })
    expect(fetch).not.toHaveBeenCalled()
  }, 15_000)

  it('returns the same image length on HEAD without sending a body', async () => {
    const get = await ogCard.fetch(new Request(cardUrl))
    const head = await ogCard.fetch(new Request(cardUrl, { method: 'HEAD' }))
    expect(head.status).toBe(200)
    expect(head.headers.get('content-length')).toBe(get.headers.get('content-length'))
    expect((await head.arrayBuffer()).byteLength).toBe(0)
  }, 15_000)

  it.each([400, 404, 503, 504])('keeps an invalid, absent or stalled capsule out of the image cache (%s)', async (status) => {
    vi.mocked(loadRpspShareMetadata).mockRejectedValue(new ShareMetadataError('Unavailable capsule', status))
    const response = await ogCard.fetch(new Request(cardUrl))
    expect(response.status).toBe(status >= 500 ? 503 : status)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect((await response.arrayBuffer()).byteLength).toBe(0)
  })

  it('renders long titles and missing duration without fetching media', async () => {
    vi.mocked(loadRpspShareMetadata).mockResolvedValue({ ...metadata, episodeTitle: 'La fidelidad de Dios nos sostiene mientras aprendemos a caminar con esperanza incluso en los momentos más difíciles de nuestra vida y nuestra fe', audioDurationSeconds: null })
    const response = await ogCard.fetch(new Request(cardUrl))
    expect(response.status).toBe(200)
    expect((await response.arrayBuffer()).byteLength).toBeLessThan(200_000)
    expect(fetch).not.toHaveBeenCalled()
  }, 15_000)
})
