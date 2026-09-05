import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAppShareData,
  createVerseShareData,
  createVerseShareUrl,
  shareVerse,
} from './shareVerse'

const originalShare = navigator.share
const originalClipboard = navigator.clipboard

function restoreNavigatorProperty(name, value) {
  Object.defineProperty(navigator, name, { configurable: true, value })
}

afterEach(() => {
  restoreNavigatorProperty('share', originalShare)
  restoreNavigatorProperty('clipboard', originalClipboard)
})

describe('shareVerse', () => {
  it('builds a human reader URL that preserves version, locale and a verse range', () => {
    expect(createVerseShareUrl({
      book: 1,
      chapter: 46,
      locale: 'pt-BR',
      origin: 'https://preview.example',
      verse: 3,
      verseEnd: 4,
      versionId: 'nbla',
    })).toBe('https://www.santabiblia.cloud/read/1/46/3?v=nbla&end=4&lang=pt-BR&share=8')
  })

  it('builds an application share pointing to the official public host', () => {
    expect(createAppShareData({ origin: 'https://preview.example' })).toEqual({
      text: 'Lee, medita y comparte la Biblia cada día.',
      title: 'Santa Biblia',
      url: 'https://www.santabiblia.cloud/',
    })
  })

  it('keeps localhost URLs available while developing', () => {
    expect(createVerseShareUrl({
      book: 43,
      chapter: 3,
      origin: 'http://127.0.0.1:5173',
      verse: 16,
      versionId: 'nbla',
    })).toBe('http://127.0.0.1:5173/read/43/3/16?v=nbla&share=8')
  })

  it('shares one detectable canonical URL so messaging apps can render its card', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const fetchMock = vi.fn().mockResolvedValue(new Response())
    restoreNavigatorProperty('share', share)
    vi.stubGlobal('fetch', fetchMock)
    const data = createVerseShareData({ reference: 'Juan 3:16', text: 'Porque de tal manera…', url: 'https://www.santabiblia.cloud/read/43/3/16?v=nbla&share=8', version: 'NBLA' })

    await expect(shareVerse(data)).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({
      title: 'Juan 3:16 · NBLA',
      url: 'https://www.santabiblia.cloud/read/43/3/16?v=nbla&share=8',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://www.santabiblia.cloud/api/og-card?type=verse&book=43&chapter=3&verse=16&v=nbla&card=8'),
      { cache: 'force-cache', credentials: 'omit' },
    )
    vi.unstubAllGlobals()
  })

  it('does not turn a cancelled native share into an error', async () => {
    restoreNavigatorProperty('share', vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')))
    restoreNavigatorProperty('clipboard', { writeText: vi.fn() })

    await expect(shareVerse({ title: 'Juan 3:16', text: 'Texto', url: 'https://example.test' })).resolves.toBe('cancelled')
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })

  it('copies the complete verse payload when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    restoreNavigatorProperty('share', undefined)
    restoreNavigatorProperty('clipboard', { writeText })
    const data = { title: 'Juan 3:16', text: 'Juan 3:16\n\nTexto', url: 'https://example.test/read/43/3/16' }

    await expect(shareVerse(data)).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(`${data.text}\n\n${data.url}`)
  })
})
