import { bibleBooks } from '../bible/catalog'

const REVISION = 'r1'
const CONCURRENCY = 4
const downloadJobs = new Map()
const downloadListeners = new Map()

export function bibleCacheName(translationId) {
  return `santa-biblia-v2-bible-${translationId}-${REVISION}`
}

export function commentaryCacheName() {
  return `santa-biblia-v2-commentary-${REVISION}`
}

export function bibleChapterUrls(translationId) {
  return bibleBooks.flatMap((book) => Array.from({ length: book.chapters }, (_, index) => {
    return `/data/${translationId}/${book.file}/${index + 1}.json`
  }))
}

export function commentaryChapterUrls() {
  return bibleBooks.flatMap((book) => Array.from({ length: book.chapters }, (_, index) => {
    return `/data/cba/${book.id}/${index + 1}.json`
  }))
}

function idleDownloadState(total) {
  return { completed: 0, error: null, status: 'idle', total }
}

function snapshot(job) {
  return {
    completed: job.completed,
    error: job.error,
    status: job.status,
    total: job.total,
  }
}

function notify(job) {
  const state = snapshot(job)
  downloadListeners.get(job.cacheName)?.forEach((listener) => listener(state))
}

function observeJob(job, onProgress) {
  if (!onProgress) return job.promise
  const listener = ({ completed, total }) => onProgress({ completed, total })
  const listeners = downloadListeners.get(job.cacheName) ?? new Set()
  listeners.add(listener)
  downloadListeners.set(job.cacheName, listeners)
  listener(snapshot(job))
  return job.promise.finally(() => listeners.delete(listener))
}

async function populateCache(job, urls) {
  if (!('caches' in globalThis)) throw new Error('Cache Storage is unavailable')
  const cache = await caches.open(job.cacheName)
  let cursor = 0
  let failure = null

  async function cacheNext() {
    while (!failure && cursor < urls.length) {
      const current = cursor
      cursor += 1
      const url = urls[current]
      try {
        const cached = await cache.match(url)
        if (!cached) {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`Unable to cache ${url}`)
          await cache.put(url, response.clone())
        }
        job.completed += 1
        notify(job)
      } catch (error) {
        failure ||= error
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, cacheNext))
  if (failure) throw failure
  return { completed: job.completed, total: job.total }
}

function cacheUrls(cacheName, urls, onProgress) {
  const currentJob = downloadJobs.get(cacheName)
  if (currentJob?.status === 'running') return observeJob(currentJob, onProgress)

  const job = {
    cacheName,
    completed: 0,
    error: null,
    promise: null,
    status: 'running',
    total: urls.length,
  }
  job.promise = populateCache(job, urls)
    .then((result) => {
      job.status = 'complete'
      notify(job)
      return result
    })
    .catch((error) => {
      job.error = error
      job.status = 'error'
      notify(job)
      throw error
    })
  downloadJobs.set(cacheName, job)
  notify(job)
  return observeJob(job, onProgress)
}

export async function prepareBibleOffline(translationId, onProgress) {
  return cacheUrls(bibleCacheName(translationId), bibleChapterUrls(translationId), onProgress)
}

export async function prepareCommentaryOffline(onProgress) {
  return cacheUrls(commentaryCacheName(), commentaryChapterUrls(), onProgress)
}

function downloadDescriptor(kind, translationId) {
  if (kind === 'bible') {
    return {
      cacheName: bibleCacheName(translationId),
      total: bibleChapterUrls(translationId).length,
    }
  }
  return {
    cacheName: commentaryCacheName(),
    total: commentaryChapterUrls().length,
  }
}

export function getOfflineDownloadState(kind, translationId) {
  const { cacheName, total } = downloadDescriptor(kind, translationId)
  const job = downloadJobs.get(cacheName)
  return job ? snapshot(job) : idleDownloadState(total)
}

export function subscribeOfflineDownload(kind, translationId, listener) {
  const { cacheName, total } = downloadDescriptor(kind, translationId)
  const listeners = downloadListeners.get(cacheName) ?? new Set()
  listeners.add(listener)
  downloadListeners.set(cacheName, listeners)
  const job = downloadJobs.get(cacheName)
  listener(job ? snapshot(job) : idleDownloadState(total))
  return () => listeners.delete(listener)
}

async function cacheCount(cacheName) {
  if (!('caches' in globalThis)) return 0
  const cache = await caches.open(cacheName)
  return (await cache.keys()).length
}

export async function getOfflineStatus(translationId) {
  const [bibleCount, commentaryCount] = await Promise.all([
    cacheCount(bibleCacheName(translationId)),
    cacheCount(commentaryCacheName()),
  ])
  return {
    bible: { cached: bibleCount, total: bibleChapterUrls(translationId).length },
    commentary: { cached: commentaryCount, total: commentaryChapterUrls().length },
  }
}

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false
  return navigator.storage.persist()
}

export async function fromOfflineCache(url) {
  if (!('caches' in globalThis)) return null
  return caches.match(url)
}
