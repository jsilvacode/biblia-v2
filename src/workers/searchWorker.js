import { prepareSearchEntries, searchEntries } from '../features/search/searchEngine'

let cachedIndex = null
let cachedTranslationId = null
let activeLoad = null

async function loadIndex(translationId) {
  if (cachedTranslationId === translationId && cachedIndex) return cachedIndex
  if (activeLoad?.translationId === translationId) return activeLoad.promise

  const promise = fetch(`/data/search/${translationId}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load search index (${response.status})`)
      return response.json()
    })
    .then((index) => {
      cachedTranslationId = translationId
      cachedIndex = prepareSearchEntries(index.entries)
      return cachedIndex
    })

  activeLoad = { promise, translationId }

  try {
    return await promise
  } finally {
    if (activeLoad?.promise === promise) activeLoad = null
  }
}

self.onmessage = async (event) => {
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
    const entries = await loadIndex(translationId)
    const page = searchEntries(entries, query, { limit: pageSize, offset })
    self.postMessage({ append, id, key, ...page, status: 'ready' })
  } catch (error) {
    self.postMessage({ append, id, key, message: error.message, results: [], status: 'error' })
  }
}
