import { searchEntries } from '../features/search/searchEngine'

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
      cachedIndex = index.entries
      return index.entries
    })

  activeLoad = { promise, translationId }

  try {
    return await promise
  } finally {
    if (activeLoad?.promise === promise) activeLoad = null
  }
}

self.onmessage = async (event) => {
  const { id, key, query, translationId } = event.data
  try {
    const entries = await loadIndex(translationId)
    self.postMessage({ id, key, results: searchEntries(entries, query), status: 'ready' })
  } catch (error) {
    self.postMessage({ id, key, message: error.message, results: [], status: 'error' })
  }
}
