import verifiedSnapshot from '../src/features/daily-video/data/verified-videos.json' with { type: 'json' }
import { isVideoId, normalizeVideoDate } from '../src/features/daily-video/dailyVideoModel.js'
import {
  createDailyVideoPostsUrl,
  DAILY_VIDEO_CHANNEL_URL,
  extractDailyVideoId,
  fetchDailyVideoDocument,
  findDailyVideoPost,
  getDailyVideoHistoryStartDate,
  normalizeDailyVideoHistory,
  validateDailyVideoSourcePageUrl,
} from './_lib/dailyVideoSource.js'

const READY_CACHE_CONTROL = 'public, s-maxage=900, stale-while-revalidate=3600'
const PENDING_CACHE_CONTROL = 'public, s-maxage=120, stale-while-revalidate=120'
const TOTAL_TIMEOUT_MS = 8_000
let sharedRequests = new Map()

function normalizeVerifiedEpisode(entry) {
  const contentDate = normalizeVideoDate(entry?.contentDate)
  const sourcePageUrl = validateDailyVideoSourcePageUrl(entry?.sourcePageUrl, contentDate)
  if (!contentDate || !sourcePageUrl || !isVideoId(entry?.videoId)) return null
  if (!Number.isSafeInteger(entry.sourcePostId) || entry.sourcePostId < 1) return null
  if (entry.episodeNumber !== null && (!Number.isSafeInteger(entry.episodeNumber) || entry.episodeNumber < 1)) return null
  if (typeof entry.title !== 'string' || !entry.title.trim() || entry.language !== 'es') return null
  return {
    contentDate, sourcePostId: entry.sourcePostId, episodeNumber: entry.episodeNumber,
    title: entry.title.trim().slice(0, 500), videoId: entry.videoId, sourcePageUrl,
    presenter: typeof entry.presenter === 'string' ? entry.presenter.trim().slice(0, 100) || null : null,
    creator: 'Este Día con Dios', channelUrl: DAILY_VIDEO_CHANNEL_URL, language: 'es',
  }
}

function verifiedEpisodes(entries) {
  if (!Array.isArray(entries)) return []
  const normalized = entries.map(normalizeVerifiedEpisode).filter(Boolean)
  // Conflicting catalogue entries should require a human correction.
  return normalized.filter((entry) => normalized.filter((other) => other.contentDate === entry.contentDate).length === 1)
}

async function onlineEpisode({ date, fetchImpl, signal }) {
  const document = await fetchDailyVideoDocument(createDailyVideoPostsUrl(date), { fetchImpl, signal })
  const result = findDailyVideoPost(JSON.parse(document.text), date)
  if (!result.post) return { status: result.status, episode: null }
  const page = await fetchDailyVideoDocument(result.post.sourcePageUrl, { fetchImpl, signal })
  const videoId = extractDailyVideoId(page.text)
  if (!videoId) return { status: 'unavailable', episode: null }
  return {
    status: 'ready',
    episode: { ...result.post, videoId, creator: 'Este Día con Dios', channelUrl: DAILY_VIDEO_CHANNEL_URL, language: 'es' },
  }
}

async function onlineHistory({ date, fetchImpl, signal }) {
  const document = await fetchDailyVideoDocument(createDailyVideoPostsUrl(date, { history: true }), { fetchImpl, signal })
  return normalizeDailyVideoHistory(JSON.parse(document.text), date)
}

function historyFrom(online, verified, date) {
  const startDate = getDailyVideoHistoryStartDate(date)
  const posts = new Map(online.map((entry) => [entry.contentDate, entry]))
  for (const { contentDate, sourcePostId, episodeNumber, title, sourcePageUrl, presenter, videoId } of verified) {
    if (contentDate >= startDate && contentDate < date) posts.set(contentDate, { contentDate, sourcePostId, episodeNumber, title, sourcePageUrl, presenter, videoId })
  }
  return [...posts.values()].sort((left, right) => right.contentDate.localeCompare(left.contentDate)).slice(0, 7)
}

async function hydrateHistoryVideos(entries, { fetchImpl, signal }) {
  const hydrated = entries.map((entry) => ({ ...entry, videoId: isVideoId(entry.videoId) ? entry.videoId : null }))
  let nextIndex = 0
  const worker = async () => {
    while (!signal.aborted) {
      const entry = hydrated[nextIndex++]
      if (!entry) return
      if (entry.videoId) continue
      try {
        const page = await fetchDailyVideoDocument(entry.sourcePageUrl, { fetchImpl, signal })
        entry.videoId = extractDailyVideoId(page.text)
      } catch {
        // Keep the date and its official link even if this thumbnail could not
        // be verified. A failed page must not discard the rest of the gallery.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, hydrated.length) }, worker))
  return hydrated
}

/** Resolve editorial dates only. Runtime memory coalesces requests, never acts as a durable catalogue. */
export async function resolveDailyVideoMetadata({
  date, history = false, fetchImpl = fetch, now = () => new Date(),
  fallbackEntries = verifiedSnapshot.entries, timeoutMs = TOTAL_TIMEOUT_MS, signal,
} = {}) {
  const normalizedDate = normalizeVideoDate(date)
  if (!normalizedDate) {
    const error = new Error('Invalid daily video date')
    error.code = 'invalid_date'
    throw error
  }
  const checked = now()
  if (!(checked instanceof Date) || Number.isNaN(checked.getTime())) throw new Error('Invalid daily video clock')
  const verified = verifiedEpisodes(fallbackEntries)
  const pinned = verified.find((entry) => entry.contentDate === normalizedDate)
  const controller = new AbortController()
  const abort = () => controller.abort()
  const budget = Number.isFinite(timeoutMs) ? Math.min(Math.max(timeoutMs, 1), TOTAL_TIMEOUT_MS) : TOTAL_TIMEOUT_MS
  const timer = setTimeout(abort, budget)
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  try {
    const options = { date: normalizedDate, fetchImpl, signal: controller.signal }
    const [resolved, previous] = await Promise.allSettled([
      onlineEpisode(options),
      history ? onlineHistory(options) : Promise.resolve([]),
    ])
    const online = resolved.status === 'fulfilled' ? resolved.value : { status: 'unavailable', episode: null }
    // A date already in the verified catalogue keeps its original association
    // when a publication is changed, disappears or the provider is unavailable.
    const differs = pinned && (!online.episode
      || online.episode.videoId !== pinned.videoId
      || online.episode.sourcePostId !== pinned.sourcePostId
      || online.episode.sourcePageUrl !== pinned.sourcePageUrl)
    const episode = differs ? pinned : online.episode
    const metadata = {
      schemaVersion: 1, date: normalizedDate,
      status: episode ? 'ready' : online.status,
      episode,
      checkedAt: checked.toISOString(),
      provenance: differs ? 'snapshot' : resolved.status === 'fulfilled' ? 'wordpress' : 'unavailable',
    }
    if (history) {
      const entries = historyFrom(previous.status === 'fulfilled' ? previous.value : [], verified, normalizedDate)
      // The current page has finished, so at most three source HTML documents
      // are fetched at once. Hydration shares the original eight-second budget.
      metadata.previous = await hydrateHistoryVideos(entries, options)
      metadata.historyStatus = previous.status === 'fulfilled' ? 'ready' : metadata.previous.length ? 'snapshot' : 'unavailable'
    }
    return metadata
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

function sharedResolution(options) {
  if (options.fetchImpl || options.now || options.fallbackEntries || options.signal || options.timeoutMs) return resolveDailyVideoMetadata(options)
  const key = `${options.date}:${options.history ? 'history' : 'current'}`
  if (!sharedRequests.has(key)) {
    const request = resolveDailyVideoMetadata(options).finally(() => sharedRequests.delete(key))
    if (sharedRequests.size >= 64) return request
    sharedRequests.set(key, request)
  }
  return sharedRequests.get(key)
}

function jsonResponse(body, { method, status = 200, cacheControl = 'no-store' } = {}) {
  return new Response(method === 'HEAD' ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl, Vary: 'Accept' },
  })
}

export function createDailyVideoHandler(options = {}) {
  return async function handler(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } })
    }
    const params = new URL(request.url).searchParams
    const dates = params.getAll('date')
    const histories = params.getAll('history')
    if (dates.length !== 1 || histories.length > 1 || (histories.length && histories[0] !== '1')
      || [...params.keys()].some((key) => key !== 'date' && key !== 'history')) {
      return jsonResponse({ error: 'invalid_request' }, { method: request.method, status: 400 })
    }
    try {
      const metadata = await sharedResolution({ ...options, date: dates[0], history: histories.length === 1 })
      const cacheControl = metadata.status === 'ready' ? READY_CACHE_CONTROL
        : metadata.status === 'pending' ? PENDING_CACHE_CONTROL : 'no-store'
      return jsonResponse(metadata, { method: request.method, cacheControl })
    } catch (error) {
      const invalid = error?.code === 'invalid_date'
      return jsonResponse({ error: invalid ? 'invalid_date' : 'daily_video_unavailable' }, {
        method: request.method, status: invalid ? 400 : 503,
      })
    }
  }
}

export function resetDailyVideoMetadataMemory() {
  sharedRequests = new Map()
}

export default { fetch: createDailyVideoHandler() }
