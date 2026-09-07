import { getBook } from './catalog'
import { fromOfflineCache } from '../offline/offlineLibrary'
import {
  normalizeCommentaryData,
  normalizeDisplayText,
  normalizeScriptureText,
} from './textNormalizer'

const chapterCache = new Map()
const chapterRequests = new Map()
const commentaryCache = new Map()
const commentaryRequests = new Map()
const MAX_CHAPTER_CACHE_ENTRIES = 32
const MAX_COMMENTARY_CACHE_ENTRIES = 8

function chapterKey(versionId, bookId, chapter) {
  return `${versionId}:${bookId}:${chapter}`
}

function readCached(cache, key) {
  if (!cache.has(key)) return null
  const value = cache.get(key)
  cache.delete(key)
  cache.set(key, value)
  return value
}

function remember(cache, key, value, maximumEntries) {
  cache.set(key, value)
  while (cache.size > maximumEntries) {
    cache.delete(cache.keys().next().value)
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
  const cachedChapter = readCached(chapterCache, key)
  if (cachedChapter) return cachedChapter

  const url = `/data/${versionId}/${book.file}/${chapter}.json`
  let request = chapterRequests.get(key)
  if (!request) {
    request = fetchJsonWithOfflineFallback(url)
      .then(normalizeChapter)
      .then((data) => {
        remember(chapterCache, key, data, MAX_CHAPTER_CACHE_ENTRIES)
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
  const key = `${bookId}:${chapter}`
  const cachedCommentary = readCached(commentaryCache, key)
  if (cachedCommentary) return cachedCommentary

  const url = `/data/cba/${bookId}/${chapter}.json`
  let request = commentaryRequests.get(key)
  if (!request) {
    request = fetchJsonWithOfflineFallback(url)
      .then(normalizeCommentaryData)
      .then((data) => {
        remember(commentaryCache, key, data, MAX_COMMENTARY_CACHE_ENTRIES)
        return data
      })
      .finally(() => {
        commentaryRequests.delete(key)
      })
    commentaryRequests.set(key, request)
  }

  return waitForRequest(request, signal)
}
