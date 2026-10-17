import { describe, expect, it, vi } from 'vitest'
import { createSearchIndexRepository } from './searchIndexRepository.js'
import { createSearchWorkerHandler } from './searchWorker.js'

describe('search worker messages', () => {
  it('echoes request metadata, keeps whole-word semantics and returns pagination', async () => {
    const repository = createSearchIndexRepository({
      fetchIndex: async () => ({
        ok: true,
        json: async () => ({ entries: [
          [1, 1, 1, 'Un animal inmundo.'],
          [43, 3, 16, 'Dios ama al mundo.'],
          [43, 1, 10, 'El mundo por Él fue hecho.'],
        ] }),
      }),
    })
    const postMessage = vi.fn()
    const handle = createSearchWorkerHandler({ repository, postMessage })
    await handle({ data: { id: 19, key: 'nbla:mundo', translationId: 'nbla', append: true, query: 'mundo', offset: 1, pageSize: 1 } })
    expect(postMessage).toHaveBeenCalledWith({
      id: 19,
      key: 'nbla:mundo',
      translationId: 'nbla',
      append: true,
      status: 'ready',
      limit: 1,
      offset: 1,
      total: 2,
      hasMore: false,
      results: [{ book: 43, chapter: 1, verse: 10, text: 'El mundo por Él fue hecho.' }],
    })
  })

  it('echoes metadata and defaults append to false on error', async () => {
    const postMessage = vi.fn()
    const handle = createSearchWorkerHandler({ postMessage })
    await handle({ data: { id: 20, key: 'invalid:paz', translationId: 'invalid', query: 'paz' } })
    expect(postMessage).toHaveBeenCalledWith({
      id: 20,
      key: 'invalid:paz',
      translationId: 'invalid',
      append: false,
      status: 'error',
      message: 'Unsupported search translation',
      results: [],
    })
  })

  it('keeps simultaneous results associated with their own versions when loads finish backwards', async () => {
    const loads = new Map()
    const repository = createSearchIndexRepository({
      fetchIndex: (url) => new Promise((resolve) => loads.set(url, resolve)),
    })
    const postMessage = vi.fn()
    const handle = createSearchWorkerHandler({ repository, postMessage })
    const a = handle({ data: { id: 1, key: 'nbla:paz', translationId: 'nbla', query: 'paz' } })
    const b = handle({ data: { id: 2, key: 'kjv:peace', translationId: 'kjv', query: 'peace' } })
    await Promise.resolve()
    loads.get('/data/search/kjv.json')({ ok: true, json: async () => ({ entries: [[43, 14, 27, 'Peace I leave with you.']] }) })
    await b
    loads.get('/data/search/nbla.json')({ ok: true, json: async () => ({ entries: [[43, 14, 27, 'La paz les dejo.']] }) })
    await a
    expect(postMessage.mock.calls.map(([message]) => [message.id, message.translationId, message.results[0].text])).toEqual([
      [2, 'kjv', 'Peace I leave with you.'],
      [1, 'nbla', 'La paz les dejo.'],
    ])
  })
})
