import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createSearchWorkerClient } from '../src/features/search/searchWorkerClient.js'
import { prepareSearchEntries } from '../src/features/search/searchEngine.js'
import { createSearchIndexRepository } from '../src/workers/searchIndexRepository.js'
import { createSearchWorkerHandler } from '../src/workers/searchWorker.js'

// Count the actual broker/worker/index pipeline using the real NBLA corpus.
// The local transport substitutes only Worker messaging and network delivery;
// these counts are not a browser/mobile timing or network-byte measurement.
const indexText = await readFile(new URL('../public/data/search/nbla.json', import.meta.url), 'utf8')
const counts = { workers: 0, fetches: 0, parses: 0, prepares: 0 }
let entries = 0

class LocalWorker {
  constructor() {
    counts.workers += 1
    const repository = createSearchIndexRepository({
      fetchIndex: async (url) => {
        assert.equal(url, '/data/search/nbla.json')
        counts.fetches += 1
        return { ok: true, json: async () => {
          counts.parses += 1
          const index = JSON.parse(indexText)
          entries = index.entries.length
          return index
        } }
      },
      prepareEntries: (rawEntries) => {
        counts.prepares += 1
        return prepareSearchEntries(rawEntries)
      },
    })
    this.handler = createSearchWorkerHandler({ repository, postMessage: data => queueMicrotask(() => this.onmessage?.({ data })) })
  }

  postMessage(data) { void this.handler({ data }) }
  terminate() {}
}

const client = createSearchWorkerClient({ createWorker: () => new LocalWorker() })
try {
  for (const queries of [['paz', 'amor'], ['paz'], ['paz']]) {
    const caller = new AbortController()
    for (const query of queries) {
      const response = await client.request({ key: `nbla:${query}`, query, translationId: 'nbla', pageSize: 3, offset: 0 }, { signal: caller.signal })
      assert.equal(response.status, 'ready')
      assert.ok(response.total > 0)
    }
    caller.abort()
  }
  assert.deepEqual(counts, { workers: 1, fetches: 1, parses: 1, prepares: 1 })
  console.log(JSON.stringify({ scenario: 'Three successive callers, shared worker before idle expiry', ...counts, indexBytes: Buffer.byteLength(indexText), entries }))
} finally {
  client.dispose()
}
