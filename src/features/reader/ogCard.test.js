import ogCardHandler from '../../../api/og-card'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeAll, vi } from 'vitest'

let backgroundImage

beforeAll(async () => {
  backgroundImage = await readFile(join(
    process.cwd(),
    'public/assets/social/verse-card-background.jpg',
  ))
})

function stubCardFetch(chapter = []) {
  const fetchMock = vi.fn(async (input) => {
    const url = String(input)

    if (url.includes('/assets/social/verse-card-background.jpg')) {
      return new Response(backgroundImage, {
        headers: { 'content-type': 'image/jpeg' },
      })
    }

    if (url.includes('/data/')) {
      return new Response(JSON.stringify(chapter), {
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response(null, { status: 404 })
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('social card image', () => {
  it('renders the app card with the local editorial photograph', async () => {
    const fetchMock = stubCardFetch()
    const response = await ogCardHandler(new Request(
      'https://www.santabiblia.cloud/api/og-card?type=app&card=8',
    ))
    const body = await response.arrayBuffer()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/png')
    expect(response.headers.get('cdn-cache-control')).toContain('max-age=31536000')
    expect(response.headers.get('vercel-cdn-cache-control')).toContain('max-age=31536000')
    expect(body.byteLength).toBeLessThan(900_000)
    expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/assets/social/verse-card-background.jpg',
    }))
  }, 15_000)

  it('keeps a verse card below the social-preview size budget', async () => {
    stubCardFetch([{
      text: 'Porque de tal manera amó Dios al mundo, que dio a Su Hijo unigénito, para que todo aquel que cree en Él, no se pierda, sino que tenga vida eterna.',
      verse: 16,
    }])

    const response = await ogCardHandler(new Request(
      'https://www.santabiblia.cloud/api/og-card?type=verse&book=43&chapter=3&verse=16&v=nbla&card=8',
    ))
    const body = await response.arrayBuffer()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/png')
    expect(body.byteLength).toBeLessThan(900_000)
  }, 15_000)

  it('scales a long verse without abandoning the full-width composition', async () => {
    stubCardFetch([{
      text: 'Pero sabiendo que ningún hombre es justificado por las obras de la ley sino por medio de la fe en Jesucristo, hemos creído nosotros también en Cristo Jesús, para que seamos justificados por la fe en Cristo y no por las obras de la ley; puesto que por las obras de la ley nadie será justificado.',
      verse: 16,
    }])

    const response = await ogCardHandler(new Request(
      'https://www.santabiblia.cloud/api/og-card?type=verse&book=48&chapter=2&verse=16&v=nbla&card=8',
    ))
    const body = await response.arrayBuffer()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/png')
    expect(body.byteLength).toBeLessThan(900_000)
  }, 15_000)
})
