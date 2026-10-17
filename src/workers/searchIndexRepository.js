import versions from '../features/bible/data/versions.json' with { type: 'json' }
import { prepareSearchEntries } from '../features/search/searchEngine.js'

const supportedTranslations = new Set(versions.filter((version) => version.available).map((version) => version.id))

function assertNotAborted(signal) {
  if (signal.aborted) throw signal.reason ?? new DOMException('The search was cancelled', 'AbortError')
}

export function createSearchIndexRepository({
  fetchIndex = (...args) => globalThis.fetch(...args),
  prepareEntries = prepareSearchEntries,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
  timeoutMs = 12_000,
} = {}) {
  const inFlight = new Map()
  let cachedEntries = null
  let cachedTranslationId = null
  let requestedTranslationId = null

  function load(translationId) {
    if (!supportedTranslations.has(translationId)) {
      return Promise.reject(new Error('Unsupported search translation'))
    }

    requestedTranslationId = translationId
    if (cachedTranslationId === translationId) return Promise.resolve(cachedEntries)
    if (inFlight.has(translationId)) return inFlight.get(translationId)

    const controller = new AbortController()
    let timer
    const deadline = new Promise((_, reject) => {
      timer = setTimer(() => {
        const error = new Error('Search index load timed out')
        error.name = 'TimeoutError'
        reject(error)
        controller.abort(error)
      }, timeoutMs)
    })
    const loading = Promise.resolve()
      .then(() => fetchIndex(`/data/search/${translationId}.json`, { signal: controller.signal }))
      .then((response) => {
        assertNotAborted(controller.signal)
        if (!response.ok) throw new Error(`Unable to load search index (${response.status})`)
        return response.json()
      })
      .then((index) => {
        assertNotAborted(controller.signal)
        return prepareEntries(index.entries)
      })

    const promise = Promise.race([loading, deadline])
      .then((entries) => {
        // An older load can finish last without replacing the requested version.
        if (requestedTranslationId === translationId) {
          cachedTranslationId = translationId
          cachedEntries = entries
        }
        return entries
      })
      .finally(() => {
        clearTimer(timer)
        if (inFlight.get(translationId) === promise) inFlight.delete(translationId)
      })

    inFlight.set(translationId, promise)
    return promise
  }

  return { load }
}
