import { bibleBooks } from '../bible/catalog'

const REVISION = 'r1'
const CONCURRENCY = 4

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

async function cacheUrls(cacheName, urls, onProgress) {
  if (!('caches' in globalThis)) throw new Error('Cache Storage is unavailable')
  const cache = await caches.open(cacheName)
  let completed = 0
  let cursor = 0

  async function cacheNext() {
    while (cursor < urls.length) {
      const current = cursor
      cursor += 1
      const url = urls[current]
      const cached = await cache.match(url)
      if (!cached) {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Unable to cache ${url}`)
        await cache.put(url, response.clone())
      }
      completed += 1
      onProgress?.({ completed, total: urls.length })
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, cacheNext))
  return { completed, total: urls.length }
}

export async function prepareBibleOffline(translationId, onProgress) {
  return cacheUrls(bibleCacheName(translationId), bibleChapterUrls(translationId), onProgress)
}

export async function prepareCommentaryOffline(onProgress) {
  return cacheUrls(commentaryCacheName(), commentaryChapterUrls(), onProgress)
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
