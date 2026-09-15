import { parseRpspDate } from './rpspDate'

const READY_CACHE_MS = 15 * 60 * 1_000
const SHORT_CACHE_MS = 2 * 60 * 1_000
const states = new Set(['ready', 'pending', 'unavailable', 'out_of_calendar'])
const cache = new Map()
const requests = new Map()

function abortError() {
  if (typeof DOMException === 'function') return new DOMException('The request was aborted', 'AbortError')
  const error = new Error('The request was aborted')
  error.name = 'AbortError'
  return error
}

function waitForRequest(request, signal) {
  if (!signal) return request
  if (signal.aborted) return Promise.reject(abortError())

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      cleanup()
      reject(abortError())
    }
    const cleanup = () => signal.removeEventListener('abort', onAbort)
    signal.addEventListener('abort', onAbort, { once: true })
    request.then(
      (value) => {
        cleanup()
        resolve(value)
      },
      (error) => {
        cleanup()
        reject(error)
      },
    )
  })
}

function validEpisode(episode) {
  if (!episode || typeof episode !== 'object') return false
  if (!/^https:\/\/www\.nuevotiempo\.org\/audio\/reavivados-por-su-palabra-2\//u.test(episode.sourcePageUrl ?? '')) return false
  if (!/^https:\/\/vod\.nuevotiempo\.org\//u.test(episode.audioUrl ?? '')) return false
  return typeof episode.id === 'string'
    && typeof episode.title === 'string'
    && !Number.isNaN(new Date(episode.publishedAt).getTime())
    && episode.presenter === null
    && episode.language === 'es'
    && episode.mimeType === 'audio/mpeg'
    && (episode.durationSeconds === null || (Number.isInteger(episode.durationSeconds) && episode.durationSeconds >= 0))
}

export function validateRpspMetadata(value, requestedDate) {
  const parsedDate = parseRpspDate(requestedDate)
  if (!parsedDate || !value || typeof value !== 'object') return null
  if (value.schemaVersion !== 1 || value.date !== parsedDate.date || !states.has(value.status)) return null
  if (Number.isNaN(new Date(value.checkedAt).getTime()) || typeof value.provenance !== 'string') return null

  if (value.status === 'out_of_calendar') {
    return value.reference === null && value.episode === null ? value : null
  }

  const reference = value.reference
  if (!Number.isInteger(reference?.book) || !Number.isInteger(reference?.chapter)) return null
  if (value.status === 'ready') return validEpisode(value.episode) ? value : null
  return value.episode === null ? value : null
}

async function requestMetadata(date, fetchImpl) {
  const response = await fetchImpl(`/api/rpsp?date=${encodeURIComponent(date)}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`Unable to load Reavivados metadata (${response.status})`)

  const metadata = validateRpspMetadata(await response.json(), date)
  if (!metadata) throw new Error('Invalid Reavivados metadata response')
  return metadata
}

export function loadRpspMetadata({ date, signal, fetchImpl = fetch, now = () => Date.now() } = {}) {
  const parsedDate = parseRpspDate(date)
  if (!parsedDate) return Promise.reject(new Error('Invalid Reavivados date'))

  const cached = cache.get(parsedDate.date)
  const maxAge = cached?.value.status === 'ready' ? READY_CACHE_MS : SHORT_CACHE_MS
  if (cached && now() - cached.storedAt < maxAge) return waitForRequest(Promise.resolve(cached.value), signal)

  let request = requests.get(parsedDate.date)
  if (!request) {
    request = requestMetadata(parsedDate.date, fetchImpl)
      .then((metadata) => {
        cache.set(parsedDate.date, { storedAt: now(), value: metadata })
        return metadata
      })
      .finally(() => requests.delete(parsedDate.date))
    requests.set(parsedDate.date, request)
  }

  return waitForRequest(request, signal)
}

export function resetRpspMetadataRepository() {
  cache.clear()
  requests.clear()
}
