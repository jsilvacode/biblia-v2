import fallbackSnapshot from '../src/features/plans/data/rpsp-audio-fallback.json' with { type: 'json' }
import overrides from '../src/features/plans/data/rpsp-audio-overrides.json' with { type: 'json' }
import { getRpspReadingForDate } from '../src/features/plans/rpspDate.js'
import {
  createRpspWordpressCandidatesUrl,
  createRpspWordpressEpisode,
  extractRpspAudioUrl,
  fetchRpspDocument,
  findRpspFeedEpisode,
  findRpspWordpressCandidate,
  getRpspFeed,
  validateRpspAudioUrl,
  validateRpspSourcePageUrl,
} from './_lib/rpspFeed.js'

const SCHEMA_VERSION = 1
const POSITIVE_CACHE_CONTROL = 'public, s-maxage=900, stale-while-revalidate=3600'
const SHORT_CACHE_CONTROL = 'public, s-maxage=120, stale-while-revalidate=120'
const TOTAL_TIMEOUT_MS = 28_000
const WORDPRESS_REQUEST_TIMEOUT_MS = 12_000

let sharedMetadataRequests = new Map()

function nowIso(now) {
  const value = now()
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw new Error('Invalid RPSP clock')
  return value.toISOString()
}

function responseJson(body, { cacheControl, method, status = 200 } = {}) {
  return new Response(method === 'HEAD' ? null : JSON.stringify(body), {
    headers: {
      'Cache-Control': cacheControl ?? 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      Vary: 'Accept',
    },
    status,
  })
}

function referenceMatches(entry, date, reference) {
  return entry?.date === date
    && entry?.reference?.book === reference.book
    && entry?.reference?.chapter === reference.chapter
}

function normalizeEpisode(episode) {
  const sourcePageUrl = validateRpspSourcePageUrl(episode?.sourcePageUrl)
  const audioUrl = validateRpspAudioUrl(episode?.audioUrl)
  const publishedAt = new Date(episode?.publishedAt ?? '')
  const title = typeof episode?.title === 'string' ? episode.title.trim().slice(0, 500) : ''
  const id = String(episode?.id ?? '').trim().slice(0, 200)
  const duration = episode?.durationSeconds

  if (!sourcePageUrl || !audioUrl || !title || !id || Number.isNaN(publishedAt.getTime())) return null
  if (episode?.mimeType !== 'audio/mpeg' || episode?.language !== 'es') return null
  if (duration !== null && (!Number.isInteger(duration) || duration < 0)) return null

  return {
    id,
    title,
    publishedAt: publishedAt.toISOString(),
    presenter: null,
    language: 'es',
    sourcePageUrl,
    audioUrl,
    mimeType: 'audio/mpeg',
    durationSeconds: duration,
  }
}

function configuredEpisode(entries, date, reference) {
  const entry = Array.isArray(entries)
    ? entries.find((candidate) => referenceMatches(candidate, date, reference))
    : null
  return entry ? normalizeEpisode(entry.episode) : null
}

function createMetadata({ date, reference, status, episode = null, provenance, checkedAt }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    date,
    reference,
    status,
    episode,
    checkedAt,
    provenance,
  }
}

function remainingRequestTimeout(deadline, maximum = 6_000) {
  const remaining = deadline - Date.now()
  if (remaining <= 0) throw new Error('RPSP request budget exhausted')
  return Math.min(maximum, remaining)
}

async function loadWordpressEpisode({ date, reference, fetchImpl, deadline }) {
  const candidatesDocument = await fetchRpspDocument(createRpspWordpressCandidatesUrl(date), {
    fetchImpl,
    timeoutMs: remainingRequestTimeout(deadline, WORDPRESS_REQUEST_TIMEOUT_MS),
  })
  const candidates = JSON.parse(candidatesDocument.text)
  const result = findRpspWordpressCandidate(candidates, { date, reference })
  if (result.ambiguous) return { episode: null, ambiguous: true }
  if (!result.candidate) return { episode: null, ambiguous: false }

  const pageDocument = await fetchRpspDocument(result.candidate.sourcePageUrl, {
    fetchImpl,
    timeoutMs: remainingRequestTimeout(deadline, WORDPRESS_REQUEST_TIMEOUT_MS),
  })
  return {
    episode: createRpspWordpressEpisode(result.candidate, extractRpspAudioUrl(pageDocument.text)),
    ambiguous: false,
  }
}

export async function resolveRpspMetadata({
  date,
  fetchImpl,
  now = () => new Date(),
  overrideEntries = overrides.entries,
  fallbackEntries = fallbackSnapshot.entries,
} = {}) {
  const reading = getRpspReadingForDate(date)
  if (reading.status === 'invalid_date') {
    const error = new Error('Invalid RPSP date')
    error.code = 'invalid_date'
    throw error
  }

  const checkedAt = nowIso(now)
  if (reading.status === 'out_of_calendar') {
    return createMetadata({
      date: reading.date,
      reference: null,
      status: 'out_of_calendar',
      provenance: 'calendar',
      checkedAt,
    })
  }

  const { reference } = reading
  const override = configuredEpisode(overrideEntries, reading.date, reference)
  if (override) {
    return createMetadata({
      date: reading.date,
      reference,
      status: 'ready',
      episode: override,
      provenance: 'override',
      checkedAt,
    })
  }

  const deadline = Date.now() + TOTAL_TIMEOUT_MS
  let wordpressAvailable = false
  try {
    const { episode, ambiguous } = await loadWordpressEpisode({
      date: reading.date,
      reference,
      fetchImpl,
      deadline,
    })
    wordpressAvailable = true
    if (ambiguous) {
      return createMetadata({
        date: reading.date,
        reference,
        status: 'unavailable',
        provenance: 'wordpress',
        checkedAt,
      })
    }
    if (episode) {
      return createMetadata({
        date: reading.date,
        reference,
        status: 'ready',
        episode,
        provenance: 'wordpress',
        checkedAt,
      })
    }
  } catch {
    // The RSS feed remains a bounded fallback for an official source outage.
  }

  try {
    const feed = await getRpspFeed({ fetchImpl, timeoutMs: remainingRequestTimeout(deadline) })
    const episode = findRpspFeedEpisode(feed.text, { date: reading.date, reference })
    if (episode) {
      return createMetadata({
        date: reading.date,
        reference,
        status: 'ready',
        episode: normalizeEpisode(episode),
        provenance: 'rss',
        checkedAt,
      })
    }

    return createMetadata({
      date: reading.date,
      reference,
      status: 'pending',
      provenance: wordpressAvailable ? 'wordpress' : 'rss',
      checkedAt,
    })
  } catch {
    const fallback = configuredEpisode(fallbackEntries, reading.date, reference)
    if (fallback) {
      return createMetadata({
        date: reading.date,
        reference,
        status: 'ready',
        episode: fallback,
        provenance: 'snapshot',
        checkedAt,
      })
    }

    return createMetadata({
      date: reading.date,
      reference,
      status: 'unavailable',
      provenance: wordpressAvailable ? 'wordpress' : 'unavailable',
      checkedAt,
    })
  }
}

function sharedResolution(options) {
  if (options.fetchImpl || options.now || options.overrideEntries || options.fallbackEntries) return resolveRpspMetadata(options)
  const key = options.date
  if (!sharedMetadataRequests.has(key)) {
    const request = resolveRpspMetadata(options).finally(() => sharedMetadataRequests.delete(key))
    sharedMetadataRequests.set(key, request)
  }
  return sharedMetadataRequests.get(key)
}

export function createRpspHandler(options = {}) {
  return async function handler(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { headers: { Allow: 'GET, HEAD' }, status: 405 })
    }

    const url = new URL(request.url)
    const dates = url.searchParams.getAll('date')
    if (dates.length !== 1 || [...url.searchParams.keys()].some((key) => key !== 'date')) {
      return responseJson({ error: 'invalid_request' }, { method: request.method, status: 400 })
    }

    try {
      const metadata = await sharedResolution({ ...options, date: dates[0] })
      const cacheControl = metadata.status === 'ready' ? POSITIVE_CACHE_CONTROL : SHORT_CACHE_CONTROL
      return responseJson(metadata, { cacheControl, method: request.method })
    } catch (error) {
      if (error?.code === 'invalid_date') {
        return responseJson({ error: 'invalid_date' }, { method: request.method, status: 400 })
      }
      return responseJson({ error: 'rpsp_unavailable' }, { method: request.method, status: 503 })
    }
  }
}

export function resetRpspMetadataMemory() {
  sharedMetadataRequests = new Map()
}

export default { fetch: createRpspHandler() }
