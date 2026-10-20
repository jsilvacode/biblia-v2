import { DAILY_VIDEO_CHANNEL, DAILY_VIDEO_CREATOR, isVideoId, isVideoSourcePage, normalizeVideoDate, shiftVideoDate } from './dailyVideoModel.js'

const CACHE_KEY = 'santa-biblia:daily-video:v1'
const MAX_CACHED_EPISODES = 15

function validEntry(entry, date) {
  return entry && entry.contentDate === date
    && Number.isSafeInteger(entry.sourcePostId) && entry.sourcePostId > 0
    && typeof entry.title === 'string' && entry.title.trim().length > 0 && entry.title.length <= 500
    && isVideoSourcePage(entry.sourcePageUrl, date)
}

export function validateDailyVideoMetadata(value, requestedDate) {
  const date = normalizeVideoDate(requestedDate)
  if (!date || value?.schemaVersion !== 1 || value?.date !== date
    || !['ready', 'pending', 'unavailable'].includes(value.status)) return null
  if (value.status === 'ready') {
    const episode = value.episode
    if (!validEntry(episode, date) || !isVideoId(episode.videoId)
      || episode.creator !== DAILY_VIDEO_CREATOR || episode.channelUrl !== DAILY_VIDEO_CHANNEL
      || episode.language !== 'es'
      || (episode.presenter !== null && (typeof episode.presenter !== 'string' || episode.presenter.length > 100))) return null
  } else if (value.episode !== null) return null

  const metadata = { ...value }
  if (value.previous !== undefined) {
    if (!Array.isArray(value.previous)) return null
    const seen = new Set()
    const firstDate = shiftVideoDate(date, -7)
    metadata.previous = value.previous.filter((entry) => {
      const entryDate = normalizeVideoDate(entry?.contentDate)
      if (!entryDate || !firstDate || entryDate < firstDate || entryDate >= date || seen.has(entryDate) || !validEntry(entry, entryDate)) return false
      seen.add(entryDate)
      return true
    }).map((entry) => ({ ...entry, videoId: isVideoId(entry.videoId) ? entry.videoId : null }))
      .sort((a, b) => b.contentDate.localeCompare(a.contentDate)).slice(0, 7)
  }
  return metadata
}

export async function loadDailyVideo({ date, history = false, signal, fetchImpl = fetch }) {
  if (!normalizeVideoDate(date)) throw new Error('Invalid capsule date')
  const url = new URL('/api/daily-video', 'https://www.santabiblia.cloud')
  url.searchParams.set('date', date)
  if (history) url.searchParams.set('history', '1')
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal?.aborted) controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, 12_000)
  try {
    const response = await fetchImpl(`${url.pathname}${url.search}`, {
      headers: { Accept: 'application/json' }, signal: controller.signal,
    })
    if (!response.ok) throw new Error('Capsule service unavailable')
    const metadata = validateDailyVideoMetadata(await response.json(), date)
    if (!metadata) throw new Error('Invalid capsule metadata')
    return metadata
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

export function readCachedDailyVideo(date) {
  try {
    const entries = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
    if (!Array.isArray(entries)) return null
    const metadata = validateDailyVideoMetadata(entries.find((entry) => entry.date === date), date)
    return metadata?.status === 'ready' ? { ...metadata, provenance: 'device-cache' } : null
  } catch {
    return null
  }
}

export function cacheDailyVideo(metadata) {
  if (metadata?.status !== 'ready') return
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]')
    const others = Array.isArray(cached) ? cached.filter((entry) => entry.date !== metadata.date) : []
    localStorage.setItem(CACHE_KEY, JSON.stringify([
      metadata, ...others,
    ].slice(0, MAX_CACHED_EPISODES)))
  } catch {
    // Public metadata remains usable when browser storage is unavailable.
  }
}
