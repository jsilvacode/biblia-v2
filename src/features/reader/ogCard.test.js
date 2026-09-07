// @vitest-environment node
import ogCard from '../../../api/og-card'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { afterEach, beforeEach, vi } from 'vitest'

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal()
  return { ...original, readFile: vi.fn(original.readFile) }
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('La tarjeta no debe depender de HTTP.') }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(readFile).mockReset()
})

const origin = 'https://www.santabiblia.cloud'

describe('entrega de tarjetas sociales', () => {
  it.each([
    ['aplicación', 'type=app'],
    ['Juan 8:12 RVA2015', 'type=verse&book=43&chapter=8&verse=12&v=rva2015'],
    ['Gálatas 2:16 NBLA', 'type=verse&book=48&chapter=2&verse=16&v=nbla'],
    ['rango KJV', 'type=verse&book=43&chapter=3&verse=16&end=18&v=kjv&lang=en'],
  ])('entrega %s como JPEG completo de menos de 200 KB, sin HTTP', async (_, query) => {
    const response = await ogCard.fetch(new Request(`${origin}/api/og-card?${query}&card=11`))
    const body = Buffer.from(await response.arrayBuffer())
    const image = await sharp(body).metadata()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/jpeg')
    expect(Number(response.headers.get('content-length'))).toBe(body.length)
    expect(response.headers.get('vercel-cdn-cache-control')).toContain('max-age=31536000')
    expect(body.length).toBeLessThan(200_000)
    expect(image).toMatchObject({ format: 'jpeg', width: 1200, height: 630, hasAlpha: false, isProgressive: false })
    expect(fetch).not.toHaveBeenCalled()
  }, 15_000)

  it('HEAD declara el mismo tamaño que GET y no envía cuerpo', async () => {
    const url = `${origin}/api/og-card?type=verse&book=43&chapter=6&verse=37&v=rva2015&card=11`
    const get = await ogCard.fetch(new Request(url))
    const head = await ogCard.fetch(new Request(url, { method: 'HEAD' }))
    expect(head.status).toBe(200)
    expect(head.headers.get('content-length')).toBe(get.headers.get('content-length'))
    expect((await head.arrayBuffer()).byteLength).toBe(0)
  }, 15_000)

  it('no almacena referencias inválidas como tarjetas genéricas', async () => {
    const response = await ogCard.fetch(new Request(`${origin}/api/og-card?type=verse&book=43&chapter=6&verse=999&v=rva2015`))
    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('no almacena una imagen incompleta si falta el fondo', async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error('Archivo temporalmente inaccesible'))
    const response = await ogCard.fetch(new Request(`${origin}/api/og-card?type=app`))
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
