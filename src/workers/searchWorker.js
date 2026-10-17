import { searchEntries } from '../features/search/searchEngine.js'
import { createSearchIndexRepository } from './searchIndexRepository.js'

export function createSearchWorkerHandler({
  repository = createSearchIndexRepository(),
  postMessage,
}) {
  return async (event) => {
    const {
      append = false,
      id,
      key,
      offset,
      pageSize,
      query,
      translationId,
    } = event.data
    try {
      const entries = await repository.load(translationId)
      const page = searchEntries(entries, query, { limit: pageSize, offset })
      postMessage({ append, id, key, translationId, ...page, status: 'ready' })
    } catch (error) {
      postMessage({ append, id, key, translationId, message: error.message, results: [], status: 'error' })
    }
  }
}

if (typeof self !== 'undefined' && typeof document === 'undefined') {
  self.onmessage = createSearchWorkerHandler({ postMessage: (message) => self.postMessage(message) })
}
