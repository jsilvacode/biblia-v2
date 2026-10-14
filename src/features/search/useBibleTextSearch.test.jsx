import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBibleTextSearch } from './useBibleTextSearch'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('search worker lifecycle', () => {
  it('starts after a real debounced search, reuses its index and terminates on unmount', () => {
    vi.useFakeTimers()
    const instances = []
    class SearchWorker {
      postMessage = vi.fn()
      terminate = vi.fn()
      constructor() { instances.push(this) }
    }
    vi.stubGlobal('Worker', SearchWorker)
    const { rerender, unmount } = renderHook(({ query, enabled }) => useBibleTextSearch({
      query, enabled, translationId: 'nbla', debounceMs: 200,
    }), { initialProps: { query: '', enabled: true } })

    expect(instances).toHaveLength(0)
    rerender({ query: 'paz', enabled: false })
    act(() => vi.advanceTimersByTime(200))
    expect(instances).toHaveLength(0)

    rerender({ query: 'paz', enabled: true })
    act(() => vi.advanceTimersByTime(199))
    expect(instances).toHaveLength(0)
    act(() => vi.advanceTimersByTime(1))
    expect(instances).toHaveLength(1)
    expect(instances[0].postMessage).toHaveBeenCalledWith(expect.objectContaining({ query: 'paz', translationId: 'nbla' }))

    rerender({ query: 'amor', enabled: true })
    act(() => vi.advanceTimersByTime(200))
    expect(instances).toHaveLength(1)
    expect(instances[0].postMessage).toHaveBeenCalledWith(expect.objectContaining({ query: 'amor' }))
    rerender({ query: '', enabled: true })
    expect(instances[0].postMessage).toHaveBeenCalledTimes(2)
    unmount()
    expect(instances[0].terminate).toHaveBeenCalledOnce()
  })
})
