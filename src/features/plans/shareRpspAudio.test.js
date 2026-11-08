import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRpspAudioShareData, shareRpspAudio } from './shareRpspAudio.js'

const options = {
  date: '2026-09-10',
  episode: { title: 'Gustad y ved que bueno es el Señor', audioUrl: 'https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3' },
  origin: 'https://preview.example',
}

afterEach(() => vi.unstubAllGlobals())

describe('Reavivados audio sharing', () => {
  it('identifies the exact chapter and keeps the capsule URL fixed after the calendar day changes', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-09-10T12:00:00Z'))
      const data = createRpspAudioShareData(options)
      expect(data.url).toBe('https://www.santabiblia.cloud/reavivados/2026-09-10')
      expect(data.title).toBe('Gustad y ved que bueno es el Señor · Salmos 34 | Reavivados por su Palabra')
      expect(data.text).toContain('Salmos 34')
      vi.setSystemTime(new Date('2026-09-11T12:00:00Z'))
      expect(createRpspAudioShareData(options)).toEqual(data)
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses the official origin while allowing local development and localized references', () => {
    expect(createRpspAudioShareData({ ...options, origin: 'http://127.0.0.1:4177', locale: 'en' }).url)
      .toBe('http://127.0.0.1:4177/reavivados/2026-09-10')
    expect(createRpspAudioShareData({ ...options, locale: 'en' }).title).toContain('Psalms 34')
    for (const origin of ['https://attacker.test', 'javascript://localhost', 'not a URL', undefined]) {
      expect(createRpspAudioShareData({ ...options, origin }).url).toBe('https://www.santabiblia.cloud/reavivados/2026-09-10')
    }
  })

  it('keeps the reflection title without repeating the source chapter and program labels', () => {
    const data = createRpspAudioShareData({
      ...options,
      date: '2026-11-08',
      episode: { ...options.episode, title: ' | La majestad de Jehová| Salmo 93 | Reavivados por su Palabra' },
    })
    expect(data.title).toBe('La majestad de Jehová · Salmos 93 | Reavivados por su Palabra')
    expect(data.text).toBe('La majestad de Jehová\nSalmos 93 · Reavivados por su Palabra')
  })

  it('rejects invalid dates, missing metadata and audio outside the official source', () => {
    for (const date of ['2026-02-30', '2027-01-01', null]) expect(createRpspAudioShareData({ ...options, date })).toBeNull()
    expect(createRpspAudioShareData()).toBeNull()
    expect(createRpspAudioShareData(null)).toBeNull()
    expect(createRpspAudioShareData({ ...options, episode: null })).toBeNull()
    expect(createRpspAudioShareData({ ...options, episode: { ...options.episode, title: '   ' } })).toBeNull()
    for (const audioUrl of ['http://vod.nuevotiempo.org/audio.mp3', 'https://vod.nuevotiempo.org.attacker.test/audio.mp3', 'https://user:secret@vod.nuevotiempo.org/audio.mp3', 'https://example.test/audio.mp3']) {
      expect(createRpspAudioShareData({ ...options, episode: { ...options.episode, audioUrl } })).toBeNull()
    }
  })

  it('shares a single canonical URL through the system share sheet without loading the audio', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    const fetchMock = vi.fn()
    vi.stubGlobal('navigator', { share, clipboard: { writeText } })
    vi.stubGlobal('fetch', fetchMock)
    await expect(shareRpspAudio(options)).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: createRpspAudioShareData(options).title, text: 'https://www.santabiblia.cloud/reavivados/2026-09-10' })
    expect(writeText).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not copy a link after the person cancels the share sheet', async () => {
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')), clipboard: { writeText } })
    await expect(shareRpspAudio(options)).resolves.toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies only the dated URL when sharing is unsupported or fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(shareRpspAudio(options)).resolves.toBe('copied')
    expect(writeText).toHaveBeenLastCalledWith('https://www.santabiblia.cloud/reavivados/2026-09-10')
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('Unsupported')), clipboard: { writeText } })
    await expect(shareRpspAudio(options)).resolves.toBe('copied')
  })

  it('reports unavailable access without rejecting or invoking sharing for invalid metadata', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
    await expect(shareRpspAudio(options)).resolves.toBe('unavailable')
    vi.stubGlobal('navigator', {})
    await expect(shareRpspAudio(options)).resolves.toBe('unavailable')
    const share = vi.fn()
    vi.stubGlobal('navigator', { share })
    await expect(shareRpspAudio({ ...options, episode: null })).resolves.toBe('unavailable')
    await expect(shareRpspAudio(null)).resolves.toBe('unavailable')
    expect(share).not.toHaveBeenCalled()
  })
})
