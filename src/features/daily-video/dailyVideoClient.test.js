import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  createVideoPath, formatVideoDate, getLocalVideoDate, normalizeVideoDate, shiftVideoDate,
} from './dailyVideoModel.js'
import { cacheDailyVideo, loadDailyVideo, readCachedDailyVideo, validateDailyVideoMetadata } from './dailyVideoRepository.js'
import { createDailyVideoShareData, shareDailyVideo } from './shareDailyVideo.js'
import { useDailyVideo } from './useDailyVideo.js'
import snapshot from './data/verified-videos.json'

const date = '2026-10-19'
const episode = snapshot.entries[0]
const ready = { schemaVersion: 1, date, status: 'ready', episode, checkedAt: '2026-10-19T12:00:00Z', provenance: 'wordpress' }
const response = (value) => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } })

beforeEach(() => {
  const values = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

describe('capsule dates and client contract', () => {
  it('keeps editorial dates across years and formats without timezone shifts', () => {
    expect(normalizeVideoDate('2028-02-29')).toBe('2028-02-29')
    expect(normalizeVideoDate('2026-02-29')).toBeNull()
    expect(normalizeVideoDate('2026-04-31')).toBeNull()
    expect(normalizeVideoDate('2026-10-19T01:00:00Z')).toBeNull()
    expect(getLocalVideoDate(new Date(2027, 0, 1, 0, 1))).toBe('2027-01-01')
    expect(createVideoPath('2027-01-01')).toBe('/este-dia-con-dios/2027-01-01')
    expect(formatVideoDate(date, 'es')).toBe('19 de octubre de 2026')
    expect(shiftVideoDate('2027-01-03', -7)).toBe('2026-12-27')
    expect(shiftVideoDate('2028-03-01', -1)).toBe('2028-02-29')
  })

  it('rejects metadata for another day, invalid embeds and untrusted source links', () => {
    expect(validateDailyVideoMetadata(ready, date)).toEqual(ready)
    expect(validateDailyVideoMetadata(ready, '2026-10-18')).toBeNull()
    expect(validateDailyVideoMetadata({ ...ready, episode: { ...episode, videoId: 'broken' } }, date)).toBeNull()
    expect(validateDailyVideoMetadata({ ...ready, episode: { ...episode, sourcePageUrl: 'https://example.com/2026/10/19/video/' } }, date)).toBeNull()
  })

  it('requests the selected date and lazy history, without contacting the provider', async () => {
    const fetchImpl = vi.fn(async () => response({ ...ready, previous: [] }))
    await loadDailyVideo({ date, history: true, fetchImpl })
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/daily-video?date=2026-10-19&history=1')
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it('keeps gallery entries within the previous week and drops invalid thumbnail IDs', () => {
    const old = { ...snapshot.entries[1], contentDate: '2026-10-11', sourcePageUrl: 'https://estediacondios.com/2026/10/11/anterior/' }
    const metadata = validateDailyVideoMetadata({
      ...ready, previous: [old, episode, snapshot.entries[1], { ...snapshot.entries[2], videoId: 'invalid' }],
    }, date)
    expect(metadata.previous).toHaveLength(2)
    expect(metadata.previous[0].videoId).toBe('mJmZNM0AHzA')
    expect(metadata.previous[1].videoId).toBeNull()
  })

  it('uses only a verified cached episode for the requested date', () => {
    cacheDailyVideo(ready)
    expect(readCachedDailyVideo(date).episode.videoId).toBe(episode.videoId)
    expect(readCachedDailyVideo('2026-10-20')).toBeNull()
    cacheDailyVideo({ ...ready, date: '2026-10-20', status: 'pending', episode: null })
    expect(readCachedDailyVideo('2026-10-20')).toBeNull()
  })
})

describe('sharing a capsule', () => {
  it('shares a dated Santa Biblia URL and preserves the chosen older episode', async () => {
    const share = vi.fn(async () => {})
    vi.stubGlobal('navigator', { share })
    await expect(shareDailyVideo({ episode: snapshot.entries[1], origin: 'https://preview.vercel.app' })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: 'https://www.santabiblia.cloud/este-dia-con-dios/2026-10-18' }))
    expect(createDailyVideoShareData({ episode, origin: 'http://127.0.0.1:4176' }).url).toBe('http://127.0.0.1:4176/este-dia-con-dios/2026-10-19')
  })

  it('copies the permalink when native share fails, and leaves cancellation alone', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(shareDailyVideo({ episode })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://www.santabiblia.cloud/este-dia-con-dios/2026-10-19')
    vi.stubGlobal('navigator', { share: vi.fn(async () => { throw new DOMException('Closed', 'AbortError') }), clipboard: { writeText } })
    writeText.mockClear()
    await expect(shareDailyVideo({ episode })).resolves.toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })
})

describe('daily capsule loading', () => {
  it('does not show a previous route episode while the next request is pending', async () => {
    let release
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response(ready)).mockImplementationOnce(() => new Promise((resolve) => { release = resolve })))
    const { result, rerender } = renderHook(({ selected }) => useDailyVideo({ date: selected }), { initialProps: { selected: date } })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    rerender({ selected: '2026-10-18' })
    expect(result.current.episode).toBeNull()
    await act(async () => release(response({ ...ready, date: '2026-10-18', episode: snapshot.entries[1] })))
    expect(result.current.episode.videoId).toBe('mJmZNM0AHzA')
  })

  it('keeps the active home date at midnight, then advances when it is released', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 19, 23, 59, 50))
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const selected = new URL(url, 'https://www.santabiblia.cloud').searchParams.get('date')
      return response({ schemaVersion: 1, date: selected, status: 'pending', episode: null })
    }))
    const { result, rerender } = renderHook(({ frozen }) => useDailyVideo({ freezeDate: frozen }), { initialProps: { frozen: true } })
    await act(async () => {})
    expect(result.current.date).toBe(date)
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(result.current.date).toBe(date)
    expect(result.current.newerDate).toBe('2026-10-20')
    rerender({ frozen: false })
    await act(async () => {})
    expect(result.current.date).toBe('2026-10-20')
  })

  it('rechecks a pending publication automatically', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn().mockResolvedValueOnce(response({ ...ready, status: 'pending', episode: null })).mockResolvedValueOnce(response(ready))
    vi.stubGlobal('fetch', fetchImpl)
    const { result } = renderHook(() => useDailyVideo({ date }))
    await act(async () => {})
    expect(result.current.status).toBe('pending')
    await act(async () => { vi.advanceTimersByTime(120_000) })
    expect(result.current.status).toBe('ready')
  })

  it('preserves a cached capsule when the service reports a provider outage', async () => {
    cacheDailyVideo(ready)
    vi.stubGlobal('fetch', vi.fn(async () => response({ ...ready, status: 'unavailable', episode: null })))
    const { result } = renderHook(() => useDailyVideo({ date }))
    await act(async () => {})
    expect(result.current.episode.videoId).toBe(episode.videoId)
    expect(result.current.metadata.provenance).toBe('device-cache')
  })
})
