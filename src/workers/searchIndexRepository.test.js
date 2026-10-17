import { afterEach, describe, expect, it, vi } from 'vitest'
import { prepareSearchEntries } from '../features/search/searchEngine.js'
import { createSearchIndexRepository } from './searchIndexRepository.js'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function response(text) {
  return { ok: true, json: vi.fn(async () => ({ entries: [[43, 3, 16, text]] })) }
}

afterEach(() => vi.useRealTimers())

describe('search index repository', () => {
  it('works with AbortController implementations that lack signal.throwIfAborted', async () => {
    const fetchIndex = vi.fn(async (_url, { signal }) => {
      Object.defineProperty(signal, 'throwIfAborted', { value: undefined })
      return response('Dios es amor.')
    })
    const repository = createSearchIndexRepository({ fetchIndex })
    expect((await repository.load('nbla'))[0][3]).toBe('Dios es amor.')
  })

  it('deduplicates concurrent fetch, parsing and preparation, then reuses the resident index', async () => {
    const pending = deferred()
    const result = response('Dios ama al mundo.')
    const fetchIndex = vi.fn(() => pending.promise)
    const prepareEntries = vi.fn(prepareSearchEntries)
    const repository = createSearchIndexRepository({ fetchIndex, prepareEntries })

    const first = repository.load('nbla')
    const second = repository.load('nbla')
    expect(second).toBe(first)
    pending.resolve(result)
    const [firstEntries, secondEntries] = await Promise.all([first, second])
    expect(firstEntries).toBe(secondEntries)
    expect(await repository.load('nbla')).toBe(firstEntries)
    expect(fetchIndex).toHaveBeenCalledOnce()
    expect(result.json).toHaveBeenCalledOnce()
    expect(prepareEntries).toHaveBeenCalledOnce()
  })

  it('deduplicates A → B → A while both versions are loading', async () => {
    const a = deferred()
    const b = deferred()
    const fetchIndex = vi.fn((url) => url.includes('nbla') ? a.promise : b.promise)
    const prepareEntries = vi.fn(prepareSearchEntries)
    const repository = createSearchIndexRepository({ fetchIndex, prepareEntries })

    const firstA = repository.load('nbla')
    const requestB = repository.load('kjv')
    const secondA = repository.load('nbla')
    expect(secondA).toBe(firstA)
    a.resolve(response('Dios es amor.'))
    const entriesA = await firstA
    b.resolve(response('God is love.'))
    const entriesB = await requestB
    expect(entriesA[0][3]).toBe('Dios es amor.')
    expect(entriesB[0][3]).toBe('God is love.')
    expect(await repository.load('nbla')).toBe(entriesA)
    expect(fetchIndex).toHaveBeenCalledTimes(2)
    expect(prepareEntries).toHaveBeenCalledTimes(2)
  })

  it('returns each version correctly when an older load completes last without replacing the requested cache', async () => {
    const a = deferred()
    const b = deferred()
    const fetchIndex = vi.fn((url) => url.includes('nbla') ? a.promise : b.promise)
    const repository = createSearchIndexRepository({ fetchIndex })

    const firstA = repository.load('nbla')
    const requestB = repository.load('kjv')
    b.resolve(response('God is love.'))
    const entriesB = await requestB
    a.resolve(response('Dios es amor.'))
    expect((await firstA)[0][3]).toBe('Dios es amor.')
    expect(await repository.load('kjv')).toBe(entriesB)
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  it('keeps a single prepared resident version', async () => {
    const fetchIndex = vi.fn(async (url) => response(url.includes('nbla') ? 'Dios es amor.' : 'God is love.'))
    const prepareEntries = vi.fn(prepareSearchEntries)
    const repository = createSearchIndexRepository({ fetchIndex, prepareEntries })
    await repository.load('nbla')
    await repository.load('kjv')
    await repository.load('nbla')
    expect(fetchIndex).toHaveBeenCalledTimes(3)
    expect(prepareEntries).toHaveBeenCalledTimes(3)
  })

  it('retains a cached request when a different in-flight version finishes later', async () => {
    const pending = deferred()
    const fetchIndex = vi.fn((url) => url.includes('nbla') ? Promise.resolve(response('Dios es amor.')) : pending.promise)
    const repository = createSearchIndexRepository({ fetchIndex })
    const entriesA = await repository.load('nbla')
    const requestB = repository.load('kjv')
    expect(await repository.load('nbla')).toBe(entriesA)
    pending.resolve(response('God is love.'))
    await requestB
    expect(await repository.load('nbla')).toBe(entriesA)
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  it.each(['../../private', '', undefined, 'NBLA', 'not-a-version'])('rejects unsupported version %s before fetching', async (translationId) => {
    const fetchIndex = vi.fn()
    const repository = createSearchIndexRepository({ fetchIndex })
    await expect(repository.load(translationId)).rejects.toThrow('Unsupported search translation')
    expect(fetchIndex).not.toHaveBeenCalled()
  })

  it('clears a network failure so the same version can retry', async () => {
    const fetchIndex = vi.fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(response('Dios es amor.'))
    const repository = createSearchIndexRepository({ fetchIndex })
    await expect(repository.load('rva2015')).rejects.toThrow('Offline')
    expect((await repository.load('rva2015'))[0][3]).toBe('Dios es amor.')
    expect(fetchIndex).toHaveBeenCalledTimes(2)
  })

  it('clears HTTP, parsing and preparation failures for retry', async () => {
    const fetchIndex = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.reject(new Error('Invalid JSON')) })
      .mockResolvedValue(response('Dios es amor.'))
    const prepareEntries = vi.fn()
      .mockImplementationOnce(() => { throw new Error('Invalid entries') })
      .mockImplementation(prepareSearchEntries)
    const repository = createSearchIndexRepository({ fetchIndex, prepareEntries })
    await expect(repository.load('nbla')).rejects.toThrow('503')
    await expect(repository.load('nbla')).rejects.toThrow('Invalid JSON')
    await expect(repository.load('nbla')).rejects.toThrow('Invalid entries')
    expect((await repository.load('nbla'))[0][3]).toBe('Dios es amor.')
    expect(fetchIndex).toHaveBeenCalledTimes(4)
  })

  it('aborts a stalled fetch after 12 seconds, ignores a late response and allows retry', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    const lateResponse = response('Late old result')
    const fetchIndex = vi.fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(response('Dios es amor.'))
    const repository = createSearchIndexRepository({ fetchIndex })
    const request = repository.load('nbla')
    const timedOut = expect(request).rejects.toMatchObject({ name: 'TimeoutError' })
    await vi.advanceTimersByTimeAsync(12_000)
    await timedOut
    expect(fetchIndex.mock.calls[0][1].signal.aborted).toBe(true)
    const retryEntries = await repository.load('nbla')
    pending.resolve(lateResponse)
    await vi.advanceTimersByTimeAsync(0)
    expect(lateResponse.json).not.toHaveBeenCalled()
    expect(await repository.load('nbla')).toBe(retryEntries)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('times out stalled JSON too, aborts, and never prepares that late index over a successful retry', async () => {
    vi.useFakeTimers()
    const pendingJson = deferred()
    const json = vi.fn(() => pendingJson.promise)
    const fetchIndex = vi.fn()
      .mockResolvedValueOnce({ ok: true, json })
      .mockResolvedValueOnce(response('Dios es amor.'))
    const prepareEntries = vi.fn(prepareSearchEntries)
    const repository = createSearchIndexRepository({ fetchIndex, prepareEntries })
    const request = repository.load('nbla')
    const timedOut = expect(request).rejects.toThrow('Search index load timed out')
    await vi.advanceTimersByTimeAsync(12_000)
    await timedOut
    expect(json).toHaveBeenCalledOnce()
    expect(fetchIndex.mock.calls[0][1].signal.aborted).toBe(true)
    const retryEntries = await repository.load('nbla')
    pendingJson.resolve({ entries: [[1, 1, 1, 'Outdated entry']] })
    await vi.advanceTimersByTimeAsync(0)
    expect(prepareEntries).toHaveBeenCalledOnce()
    expect(await repository.load('nbla')).toBe(retryEntries)
    expect(vi.getTimerCount()).toBe(0)
  })
})
