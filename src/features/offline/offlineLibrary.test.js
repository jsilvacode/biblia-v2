import { vi } from 'vitest'
import {
  bibleChapterUrls,
  commentaryChapterUrls,
  getOfflineDownloadState,
  prepareBibleOffline,
  subscribeOfflineDownload,
} from './offlineLibrary'

describe('offline library manifests', () => {
  it('covers every canonical Bible chapter for a version', () => {
    const urls = bibleChapterUrls('nbla')
    expect(urls).toHaveLength(1189)
    expect(urls).toContain('/data/nbla/43_juan/3.json')
  })

  it('aligns commentary chapters to the same canonical scope', () => {
    const urls = commentaryChapterUrls()
    expect(urls).toHaveLength(1189)
    expect(urls).toContain('/data/cba/43/3.json')
  })

  it('shares one active download instead of duplicating its requests', async () => {
    const cache = {
      match: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    }
    vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ clone: () => ({}), ok: true }))

    const first = prepareBibleOffline('concurrent-test')
    const second = prepareBibleOffline('concurrent-test')
    const updates = []
    const unsubscribe = subscribeOfflineDownload('bible', 'concurrent-test', (state) => updates.push(state.status))
    await Promise.all([first, second])
    unsubscribe()

    expect(fetch).toHaveBeenCalledTimes(1189)
    expect(updates[0]).toBe('running')
    expect(updates.at(-1)).toBe('complete')
    expect(getOfflineDownloadState('bible', 'concurrent-test')).toMatchObject({
      completed: 1189,
      status: 'complete',
      total: 1189,
    })
    vi.unstubAllGlobals()
  })

  it('waits for active workers to stop before reporting a failed download', async () => {
    const cache = {
      match: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 5))),
    }
    vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(cache) })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ clone: () => ({}), ok: false })
      .mockResolvedValue({ clone: () => ({}), ok: true }))

    await expect(prepareBibleOffline('failure-test')).rejects.toThrow('Unable to cache')

    expect(fetch.mock.calls.length).toBeLessThanOrEqual(4)
    expect(cache.put).toHaveBeenCalledTimes(fetch.mock.calls.length - 1)
    expect(getOfflineDownloadState('bible', 'failure-test').status).toBe('error')
    vi.unstubAllGlobals()
  })
})
