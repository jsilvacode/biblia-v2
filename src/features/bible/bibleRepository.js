import { getBook } from './catalog'
import { fromOfflineCache } from '../offline/offlineLibrary'
import {
  normalizeCommentaryData,
  normalizeDisplayText,
  normalizeScriptureText,
} from './textNormalizer'

const chapterCache = new Map()
const chapterRequests = new Map()
const MAX_CHAPTER_CACHE_ENTRIES = 32

function chapterKey(versionId, bookId, chapter) {
  return `${versionId}:${bookId}:${chapter}`
}

function readCachedChapter(key) {
  if (!chapterCache.has(key)) return null
  const chapter = chapterCache.get(key)
  chapterCache.delete(key)
  chapterCache.set(key, chapter)
  return chapter
}

function rememberChapter(key, chapter) {
  chapterCache.set(key, chapter)
  while (chapterCache.size > MAX_CHAPTER_CACHE_ENTRIES) {
    chapterCache.delete(chapterCache.keys().next().value)
  }
}

function normalizeChapter(data) {
  if (!Array.isArray(data)) return []

  return data.map((verse) => ({
    ...verse,
    ...(typeof verse.heading === 'string' ? { heading: normalizeDisplayText(verse.heading) } : {}),
    text: normalizeScriptureText(verse.text),
  }))
}

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
    const handleAbort = () => {
      cleanup()
      reject(abortError())
    }
    const cleanup = () => signal.removeEventListener('abort', handleAbort)

    signal.addEventListener('abort', handleAbort, { once: true })
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

async function fetchJsonWithOfflineFallback(url) {
  let response
  try {
    response = await fetch(url)
  } catch (error) {
    response = await fromOfflineCache(url)
    if (!response) throw error
  }
  if (!response.ok) {
    const cachedResponse = await fromOfflineCache(url)
    if (cachedResponse) response = cachedResponse
  }
  if (!response.ok) throw new Error(`Unable to load resource (${response.status})`)
  return response.json()
}

export async function loadChapter({ versionId, bookId, chapter, signal }) {
  const book = getBook(bookId)
  if (!book) throw new Error(`Unknown book: ${bookId}`)

  const key = chapterKey(versionId, bookId, chapter)
  const cachedChapter = readCachedChapter(key)
  if (cachedChapter) return cachedChapter

  const url = `/data/${versionId}/${book.file}/${chapter}.json`
  let request = chapterRequests.get(key)
  if (!request) {
    request = fetchJsonWithOfflineFallback(url)
      .then(normalizeChapter)
      .then((data) => {
        rememberChapter(key, data)
        return data
      })
      .finally(() => {
        chapterRequests.delete(key)
      })
    chapterRequests.set(key, request)
  }

  return waitForRequest(request, signal)
}

export async function loadCommentary({ bookId, chapter, signal }) {
  const url = `/data/cba/${bookId}/${chapter}.json`
  let response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    response = await fromOfflineCache(url)
    if (!response) throw error
  }
  if (!response.ok) {
    const cachedResponse = await fromOfflineCache(url)
    if (cachedResponse) response = cachedResponse
  }
  if (!response.ok) throw new Error(`Unable to load commentary (${response.status})`)
  return normalizeCommentaryData(await response.json())
}
