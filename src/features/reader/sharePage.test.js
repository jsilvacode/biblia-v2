import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../api/share-page'

afterEach(() => vi.unstubAllGlobals())

describe('share page endpoint', () => {
  it('returns the production SPA with request-host metadata for a verse', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).endsWith('/index.html')) {
        return {
          ok: true,
          text: async () => '<head><!-- share-meta:start --><title>Santa Biblia</title><!-- share-meta:end --></head><body><div id="root"></div></body>',
        }
      }
      return {
        json: async () => [{ text: 'Porque de tal manera amó Dios al mundo.', verse: 16 }],
        ok: true,
      }
    }))
    const request = new Request('https://biblia-v2.vercel.app/api/share-page?book=43&chapter=3&type=verse&v=nbla&verse=16', {
      headers: { 'x-forwarded-host': 'biblia-v2.vercel.app', 'x-forwarded-proto': 'https' },
      method: 'GET',
    })

    const response = await handler(request)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')
    expect(body).toContain('<div id="root"></div>')
    expect(body).toContain('Juan 3:16 | Santa Biblia')
    expect(body).toContain('https://biblia-v2.vercel.app/read/43/3/16?v=nbla')
    expect(body).toContain('Porque de tal manera amó Dios al mundo.')
  })
})
