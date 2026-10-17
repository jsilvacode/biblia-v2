import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSearchWorkerClient } from './searchWorkerClient'

const clients = []
const payload = (translationId = 'nbla', query = 'paz', extra = {}) => ({ translationId, query, key: `${translationId}:${query}`, pageSize: 3, offset: 0, ...extra })

function setup(options = {}) {
  const workers = []
  const createWorker = vi.fn(() => {
    const worker = { postMessage: vi.fn(), terminate: vi.fn() }
    workers.push(worker)
    return worker
  })
  const client = createSearchWorkerClient({ createWorker, ...options })
  clients.push(client)
  return { client, workers, createWorker }
}

function reply(worker, requestIndex = 0, patch = {}) {
  const request = worker.postMessage.mock.calls[requestIndex][0]
  worker.onmessage({ data: { ...request, hasMore: false, results: [{ text: request.query }], status: 'ready', total: 1, ...patch } })
  return request
}

afterEach(() => {
  clients.splice(0).forEach(client => client.dispose())
  vi.useRealTimers()
})

describe('shared search worker client', () => {
  it('starts lazily, isolates simultaneous IDs, and accepts responses in reverse order', async () => {
    const { client, workers, createWorker } = setup()
    expect(createWorker).not.toHaveBeenCalled()
    const first = client.request(payload('nbla', 'paz'))
    const second = client.request(payload('rva2015', 'amor', { pageSize: 50 }))
    expect(workers).toHaveLength(1)
    const ids = workers[0].postMessage.mock.calls.map(([message]) => message.id)
    expect(new Set(ids).size).toBe(2)
    reply(workers[0], 1)
    reply(workers[0], 0)
    expect(await first).toMatchObject({ translationId: 'nbla', key: 'nbla:paz', results: [{ text: 'paz' }] })
    expect(await second).toMatchObject({ translationId: 'rva2015', key: 'rva2015:amor', results: [{ text: 'amor' }] })
  })

  it('cancels only its own request and ignores its late response', async () => {
    const { client, workers } = setup()
    const controller = new AbortController()
    const cancelled = client.request(payload(), { signal: controller.signal }).catch(error => error)
    const active = client.request(payload('nbla', 'amor'))
    controller.abort()
    expect(await cancelled).toMatchObject({ name: 'AbortError' })
    expect(workers[0].terminate).not.toHaveBeenCalled()
    reply(workers[0], 0)
    reply(workers[0], 1)
    expect(await active).toMatchObject({ results: [{ text: 'amor' }] })
  })

  it('does not create a worker for an already cancelled request', async () => {
    const { client, createWorker } = setup()
    const controller = new AbortController()
    controller.abort()
    await expect(client.request(payload(), { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(createWorker).not.toHaveBeenCalled()
  })

  it('reuses the worker across callers and releases it after two idle minutes', async () => {
    vi.useFakeTimers()
    const { client, workers } = setup()
    const first = client.request(payload())
    reply(workers[0])
    await first
    await vi.advanceTimersByTimeAsync(119_999)
    expect(workers[0].terminate).not.toHaveBeenCalled()
    const second = client.request(payload('nbla', 'amor'))
    expect(workers).toHaveLength(1)
    reply(workers[0], 1)
    await second
    await vi.advanceTimersByTimeAsync(120_000)
    expect(workers[0].terminate).toHaveBeenCalledOnce()
    const third = client.request(payload())
    expect(workers).toHaveLength(2)
    expect(workers[1].postMessage.mock.calls[0][0].id).toBeGreaterThan(workers[0].postMessage.mock.calls[1][0].id)
    reply(workers[1])
    await third
  })

  it('does not idle-terminate a live request and recovers from a silent worker timeout', async () => {
    vi.useFakeTimers()
    const { client, workers } = setup({ idleMs: 5, requestTimeoutMs: 20 })
    const result = client.request(payload()).catch(error => error)
    await vi.advanceTimersByTimeAsync(10)
    expect(workers[0].terminate).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(10)
    expect((await result).message).toMatch(/timed out/)
    expect(workers[0].terminate).toHaveBeenCalledOnce()
    const retried = client.request(payload())
    expect(workers).toHaveLength(2)
    reply(workers[1])
    await expect(retried).resolves.toMatchObject({ status: 'ready' })
  })

  it('does not let one timed-out caller terminate another active search', async () => {
    vi.useFakeTimers()
    const { client, workers } = setup({ requestTimeoutMs: 100 })
    const first = client.request(payload()).catch(error => error)
    await vi.advanceTimersByTimeAsync(50)
    const second = client.request(payload('nbla', 'amor'))
    await vi.advanceTimersByTimeAsync(50)
    expect((await first).message).toMatch(/timed out/)
    expect(workers[0].terminate).not.toHaveBeenCalled()
    reply(workers[0], 1)
    await expect(second).resolves.toMatchObject({ results: [{ text: 'amor' }] })
  })

  it('reports a request error and permits the same query again without discarding the worker', async () => {
    const { client, workers } = setup()
    const failed = client.request(payload()).catch(error => error)
    reply(workers[0], 0, { status: 'error', message: 'Index unavailable' })
    expect((await failed).message).toBe('Index unavailable')
    const retried = client.request(payload())
    expect(workers).toHaveLength(1)
    reply(workers[0], 1)
    await expect(retried).resolves.toMatchObject({ status: 'ready' })
  })

  it.each(['onerror', 'onmessageerror'])('rejects all affected callers on %s and can create a healthy worker', async (eventName) => {
    const { client, workers } = setup()
    const first = client.request(payload()).catch(error => error)
    const second = client.request(payload('nbla', 'amor')).catch(error => error)
    workers[0][eventName]({ message: 'Worker stopped', preventDefault: vi.fn() })
    expect(await first).toBeInstanceOf(Error)
    expect(await second).toBeInstanceOf(Error)
    expect(workers[0].terminate).toHaveBeenCalledOnce()
    const retried = client.request(payload())
    reply(workers[1])
    await expect(retried).resolves.toMatchObject({ status: 'ready' })
  })

  it('does not accept another key or translation as the requested result', async () => {
    const { client, workers } = setup()
    const result = client.request(payload()).catch(error => error)
    reply(workers[0], 0, { translationId: 'kjv' })
    expect((await result).message).toMatch(/did not match/)
  })

  it('recovers when constructing or sending to the worker fails', async () => {
    const { client, createWorker, workers } = setup()
    createWorker.mockImplementationOnce(() => { throw new Error('Unavailable worker') })
    await expect(client.request(payload())).rejects.toThrow('Unavailable worker')
    const retried = client.request(payload())
    reply(workers[0])
    await retried
    workers[0].postMessage.mockImplementationOnce(() => { throw new Error('Cannot send') })
    await expect(client.request(payload())).rejects.toThrow('Cannot send')
    expect(workers[0].terminate).toHaveBeenCalledOnce()
    const healthy = client.request(payload())
    reply(workers[1])
    await healthy
  })
})
