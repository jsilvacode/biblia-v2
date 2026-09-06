// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sharePage from '../../../api/share-page'

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal()
  return { ...original, readFile: vi.fn(original.readFile) }
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Compartir no debe depender de HTTP.') }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.mocked(readFile).mockReset()
})

describe('share page endpoint', () => {
  it('no conserva una vista previa genérica cuando falla temporalmente el capítulo', async () => {
    vi.mocked(readFile).mockImplementation(async (path) => {
      if (path.endsWith('index.html')) {
        return '<head><!-- share-meta:start --><!-- share-meta:end --></head><body><div id="root"></div></body>'
      }
      throw new Error('Capítulo temporalmente inaccesible')
    })
    const response = await sharePage.fetch(new Request('https://www.santabiblia.cloud/api/share-page?type=verse&book=43&chapter=8&verse=12&v=rva2015'))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toContain('<div id="root"></div>')
  })

  it('returns the production SPA with request-host metadata for a verse', async () => {
    vi.mocked(readFile).mockImplementation(async (path) => {
      if (path.endsWith('index.html')) {
        return '<head><!-- share-meta:start --><title>Santa Biblia</title><!-- share-meta:end --></head><body><div id="root"></div></body>'
      }
      return JSON.stringify([{ text: 'Porque de tal manera amó Dios al mundo.', verse: 16 }])
    })
    const request = new Request('https://biblia-v2.vercel.app/api/share-page?book=43&chapter=3&type=verse&v=nbla&verse=16', {
      headers: { 'x-forwarded-host': 'biblia-v2.vercel.app', 'x-forwarded-proto': 'https' },
      method: 'GET',
    })

    const response = await sharePage.fetch(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    expect(body).toContain('<div id="root"></div>')
    expect(body).toContain('Juan 3:16 | Santa Biblia')
    expect(body).toContain('https://biblia-v2.vercel.app/read/43/3/16?v=nbla')
    expect(body).toContain('Porque de tal manera amó Dios al mundo.')
    expect(body).toContain('image/jpeg')
    expect(body).toContain('card=10')
    expect(fetch).not.toHaveBeenCalled()
  })
})
