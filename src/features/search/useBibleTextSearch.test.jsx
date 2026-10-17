import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchWorkerClient } from './searchWorkerClient'
import { useBibleTextSearch } from './useBibleTextSearch'

let instances

beforeEach(() => {
  instances = []
  class SearchWorker {
    postMessage = vi.fn()
    terminate = vi.fn()
    constructor() { instances.push(this) }
  }
  vi.stubGlobal('Worker', SearchWorker)
})

afterEach(() => {
  cleanup()
  searchWorkerClient.dispose()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

async function reply(index, patch = {}, worker = instances[0]) {
  const request = worker.postMessage.mock.calls[index][0]
  await act(async () => {
    worker.onmessage({ data: {
      ...request,
      hasMore: false,
      results: [{ book: 43, chapter: 3, verse: 16, text: request.query }],
      status: 'ready', total: 1,
      ...patch,
    } })
  })
  return request
}

describe('shared search hook lifecycle', () => {
  it('starts after a debounced text search and reuses the worker after unmount/remount', async () => {
    vi.useFakeTimers()
    const useSearch = ({ query, enabled }) => useBibleTextSearch({ query, enabled, translationId: 'nbla', debounceMs: 200 })
    const { result, rerender, unmount } = renderHook(useSearch, { initialProps: { query: '', enabled: true } })
    expect(instances).toHaveLength(0)
    rerender({ query: 'paz', enabled: false })
    await act(() => vi.advanceTimersByTimeAsync(200))
    expect(instances).toHaveLength(0)
    rerender({ query: 'paz', enabled: true })
    await act(() => vi.advanceTimersByTimeAsync(199))
    expect(instances).toHaveLength(0)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(instances).toHaveLength(1)
    await reply(0)
    expect(result.current).toMatchObject({ status: 'ready', results: [{ text: 'paz' }] })
    unmount()
    expect(instances[0].terminate).not.toHaveBeenCalled()
    const next = renderHook(useSearch, { initialProps: { query: 'amor', enabled: true } })
    await act(() => vi.advanceTimersByTimeAsync(200))
    expect(instances).toHaveLength(1)
    await reply(1)
    expect(next.result.current).toMatchObject({ status: 'ready', results: [{ text: 'amor' }] })
  })

  it('isolates simultaneous hook instances and does not cancel the survivor on unmount', async () => {
    const first = renderHook(() => useBibleTextSearch({ query: 'paz', translationId: 'nbla', pageSize: 3 }))
    const second = renderHook(() => useBibleTextSearch({ query: 'love', translationId: 'kjv', pageSize: 50 }))
    expect(instances).toHaveLength(1)
    const messages = instances[0].postMessage.mock.calls.map(([message]) => message)
    expect(new Set(messages.map(({ id }) => id)).size).toBe(2)
    await reply(1)
    expect(second.result.current).toMatchObject({ results: [{ text: 'love' }] })
    expect(first.result.current.status).toBe('loading')
    first.unmount()
    expect(instances[0].terminate).not.toHaveBeenCalled()
    await reply(0)
    expect(second.result.current).toMatchObject({ results: [{ text: 'love' }] })
  })

  it('ignores late replies after query, translation, or enabled-state changes', async () => {
    const { result, rerender } = renderHook(props => useBibleTextSearch(props), {
      initialProps: { query: 'paz', translationId: 'nbla', enabled: true },
    })
    rerender({ query: 'amor', translationId: 'nbla', enabled: true })
    await reply(0)
    expect(result.current.status).toBe('loading')
    await reply(1)
    expect(result.current.results[0].text).toBe('amor')
    rerender({ query: 'love', translationId: 'kjv', enabled: true })
    expect(result.current.results).toEqual([])
    rerender({ query: '', translationId: 'kjv', enabled: false })
    await reply(2)
    expect(result.current).toMatchObject({ status: 'idle', results: [] })
  })

  it('keeps prior pages on a pagination failure and retries that page without duplicates', async () => {
    const { result } = renderHook(() => useBibleTextSearch({ query: 'paz', translationId: 'nbla', pageSize: 2 }))
    await reply(0, { hasMore: true, total: 4, results: [{ verse: 1 }, { verse: 2 }] })
    act(() => { result.current.loadMore(); result.current.loadMore() })
    expect(instances[0].postMessage).toHaveBeenCalledTimes(2)
    expect(instances[0].postMessage.mock.calls[1][0]).toMatchObject({ append: true, offset: 2, pageSize: 2 })
    await reply(1, { status: 'error', message: 'Temporary failure' })
    expect(result.current).toMatchObject({ status: 'ready', results: [{ verse: 1 }, { verse: 2 }], loadMoreError: 'Temporary failure', isLoadingMore: false })
    act(() => result.current.loadMore())
    expect(instances[0].postMessage.mock.calls[2][0].offset).toBe(2)
    await reply(2, { total: 4, results: [{ verse: 3 }, { verse: 4 }] })
    expect(result.current).toMatchObject({ results: [{ verse: 1 }, { verse: 2 }, { verse: 3 }, { verse: 4 }], loadMoreError: null, hasMore: false })
  })

  it('retries the same failed query explicitly and recovers after a worker crash', async () => {
    const { result } = renderHook(() => useBibleTextSearch({ query: 'paz', translationId: 'nbla' }))
    await act(async () => instances[0].onerror({ message: 'Worker unavailable', preventDefault: vi.fn() }))
    expect(result.current.status).toBe('error')
    expect(instances[0].postMessage).toHaveBeenCalledOnce()
    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')
    expect(instances).toHaveLength(2)
    await reply(0, {}, instances[1])
    expect(result.current).toMatchObject({ status: 'ready', results: [{ text: 'paz' }], message: null })
  })

  it('does not append an old page after another query starts', async () => {
    const { result, rerender } = renderHook(({ query }) => useBibleTextSearch({ query, translationId: 'nbla' }), { initialProps: { query: 'paz' } })
    await reply(0, { hasMore: true, total: 2 })
    act(() => result.current.loadMore())
    rerender({ query: 'amor' })
    await reply(1, { results: [{ text: 'Old page' }] })
    expect(result.current.results).toEqual([])
    await reply(2)
    expect(result.current.results.map(({ text }) => text)).toEqual(['amor'])
  })
})
