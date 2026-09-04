import { readFile } from 'node:fs/promises'
import { vi } from 'vitest'
import {
  createAppShareMetadata,
  getRequestOrigin,
  injectShareMetadata,
  loadVerseShareMetadata,
  parseVerseShareQuery,
} from '../../../api/_lib/shareMetadata'

describe('share metadata', () => {
  it('uses the forwarded request host for previews and the future custom domain', () => {
    expect(getRequestOrigin({
      headers: {
        host: 'internal.example',
        'x-forwarded-host': 'biblia-v2.vercel.app',
        'x-forwarded-proto': 'https',
      },
    })).toBe('https://biblia-v2.vercel.app')
  })

  it('accepts Web Request headers and URL in the Edge image endpoint', () => {
    expect(getRequestOrigin(new Request('https://preview.example/api/og-card?type=app')))
      .toBe('https://preview.example')
    expect(getRequestOrigin(new Request('http://127.0.0.1:3000/api/og-card')))
      .toBe('http://127.0.0.1:3000')
  })

  it('validates versions and bounded verse ranges', () => {
    expect(parseVerseShareQuery({ book: '1', chapter: '46', end: '4', v: 'nbla', verse: '3' }))
      .toMatchObject({ chapter: 46, verseEnd: 4, verseStart: 3, version: { id: 'nbla' } })
    expect(() => parseVerseShareQuery({ book: '1', chapter: '46', end: '30', v: 'nbla', verse: '3' }))
      .toThrow('Rango de versículos inválido')
    expect(() => parseVerseShareQuery({ book: '1', chapter: '46', v: 'desconocida', verse: '3' }))
      .toThrow('Versión bíblica inválida')
  })

  it('loads the exact range and builds absolute metadata URLs', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      json: async () => [
        { text: '»No temas bajar a Egipto,', verse: 3 },
        { text: 'Yo descenderé contigo.', verse: 4 },
      ],
      ok: true,
    })
    const metadata = await loadVerseShareMetadata({
      fetchImpl,
      origin: 'https://biblia-v2.vercel.app',
      query: { book: '1', chapter: '46', end: '4', v: 'nbla', verse: '3' },
    })

    expect(metadata.citation).toBe('Génesis 46:3-4 · NBLA')
    expect(metadata.text).toBe('No temas bajar a Egipto, Yo descenderé contigo.')
    expect(metadata.canonicalUrl).toBe('https://biblia-v2.vercel.app/read/1/46/3?v=nbla&end=4')
    expect(metadata.imageUrl).toContain('https://biblia-v2.vercel.app/api/og-card?')
    expect(metadata.imageUrl).toContain('card=5')
    expect(fetchImpl).toHaveBeenCalledWith(new URL('https://biblia-v2.vercel.app/data/nbla/01_genesis/46.json'))
  })

  it('uses the current branded card revision for the application preview', () => {
    expect(createAppShareMetadata('https://www.santabiblia.cloud').imageUrl)
      .toBe('https://www.santabiblia.cloud/og-share.jpg?v=5')
  })

  it('keeps the static SPA preview on the live V2 card endpoint', async () => {
    const html = await readFile('index.html', 'utf8')

    expect(html).toContain('https://www.santabiblia.cloud/og-share.jpg?v=5')
    expect(html).not.toContain('biblia-v2.vercel.app/api/og-card')
  })

  it('escapes verse content before injecting social metadata into HTML', () => {
    const metadata = {
      ...createAppShareMetadata('https://preview.example'),
      description: 'Una cita <especial> & "segura"',
    }
    const html = '<head><!-- share-meta:start --><title>Anterior</title><!-- share-meta:end --></head>'
    const rendered = injectShareMetadata(html, metadata)

    expect(rendered).toContain('Una cita &lt;especial&gt; &amp; &quot;segura&quot;')
    expect(rendered).not.toContain('<title>Anterior</title>')
  })
})
