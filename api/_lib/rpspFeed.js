import { XMLParser } from 'fast-xml-parser'

export const RPSP_RSS_URL = 'https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/feed/'
export const RPSP_SOURCE_PATH = '/audio/reavivados-por-su-palabra-2/'

const SOURCE_HOST = 'www.nuevotiempo.org'
const AUDIO_HOST = 'vod.nuevotiempo.org'
const WORDPRESS_PATH = '/wp-json/wp/v2/audio'
const MAX_DOCUMENT_BYTES = 1_000_000
const REQUEST_TIMEOUT_MS = 6_000
const MAX_REDIRECTS = 2

const monthByName = Object.freeze({
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
})

const bookAliases = Object.freeze({
  9: ['1 samuel', 'i samuel', 'primer samuel', 'primera samuel'],
  10: ['2 samuel', 'ii samuel', 'segundo samuel', 'segunda samuel'],
  11: ['1 reyes', 'i reyes', 'primer reyes', 'primera reyes'],
  12: ['2 reyes', 'ii reyes', 'segundo reyes', 'segunda reyes'],
  13: ['1 cronicas', 'i cronicas', 'primer cronicas', 'primera cronicas'],
  14: ['2 cronicas', 'ii cronicas', 'segundo cronicas', 'segunda cronicas'],
  15: ['esdras'],
  16: ['nehemias'],
  17: ['ester'],
  18: ['job'],
  19: ['salmo', 'salmos'],
})

let rssMemory = { etag: null, lastModified: null, text: null }
let sharedRssRequest = null

function textValue(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && typeof value['#text'] !== 'undefined') return textValue(value['#text'])
  return ''
}

function cleanText(value, maxLength = 500) {
  return textValue(value)
    .replace(/<[^>]*>/gu, ' ')
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&quot;/giu, '"')
    .replace(/&#(?:x0*27|0*39);/giu, "'")
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, maxLength)
}

function normalizeReferenceText(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim()
}

function escapeExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

function parseDuration(value) {
  const raw = cleanText(value, 20)
  if (!raw) return null
  if (/^\d+$/u.test(raw)) return Number(raw)

  const parts = raw.split(':').map(Number)
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) return null
  if (parts.slice(1).some((part) => part > 59)) return null
  return parts.reduce((total, part) => total * 60 + part, 0)
}

function parsePublishedAt(value) {
  const raw = cleanText(value, 100)
  const date = new Date(raw)
  if (!raw || Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function parseRssCivilDate(value) {
  const raw = cleanText(value, 100)
  const match = /(?:^|,\s*)(\d{1,2})\s+([a-z]{3})\s+(\d{4})\s+\d{2}:\d{2}(?::\d{2})?\s+[+-]\d{4}(?:\s|$)/iu.exec(raw)
  if (!match) return null

  const month = monthByName[match[2].toLocaleLowerCase('en')]
  if (!month) return null
  const year = Number(match[3])
  const day = Number(match[1])
  const candidate = new Date(Date.UTC(year, month - 1, day))
  if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) return null

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value ?? ''))
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null
    return url
  } catch {
    return null
  }
}

export function validateRpspSourcePageUrl(value) {
  const url = normalizeUrl(value)
  if (!url || url.hostname !== SOURCE_HOST || !url.pathname.startsWith(RPSP_SOURCE_PATH)) return null
  return url.toString()
}

export function validateRpspAudioUrl(value) {
  const url = normalizeUrl(value)
  if (!url || url.hostname !== AUDIO_HOST) return null
  return url.toString()
}

function validateWordpressUrl(value) {
  const url = normalizeUrl(value)
  if (!url || url.hostname !== SOURCE_HOST || url.pathname !== WORDPRESS_PATH) return null
  return url.toString()
}

function validateDocumentUrl(value) {
  return validateRpspSourcePageUrl(value) ?? validateWordpressUrl(value) ?? (value === RPSP_RSS_URL ? value : null)
}

function hasExactReference(title, reference) {
  const aliases = bookAliases[reference?.book]
  if (!aliases || !Number.isInteger(reference?.chapter)) return false

  const text = normalizeReferenceText(title)
  return aliases.some((alias) => {
    const pattern = new RegExp(`(?:^|\\s)${escapeExpression(alias)}\\s+${reference.chapter}(?=\\s|$)`, 'u')
    return pattern.test(text)
  })
}

function inferMimeType(value) {
  const audioUrl = validateRpspAudioUrl(value)
  return audioUrl?.toLocaleLowerCase('en').endsWith('.mp3') ? 'audio/mpeg' : null
}

function normalizeRssItem(item) {
  const enclosure = Array.isArray(item?.enclosure) ? item.enclosure[0] : item?.enclosure
  const title = cleanText(item?.title)
  const sourcePageUrl = validateRpspSourcePageUrl(textValue(item?.link))
  const audioUrl = validateRpspAudioUrl(enclosure?.['@_url'])
  const publishedAt = parsePublishedAt(item?.pubDate)
  const declaredDate = parseRssCivilDate(item?.pubDate)
  const mimeType = cleanText(enclosure?.['@_type'], 80).toLocaleLowerCase('en') || inferMimeType(audioUrl)
  const id = cleanText(item?.guid || sourcePageUrl, 200)

  if (!title || !sourcePageUrl || !audioUrl || !publishedAt || !declaredDate || !id || mimeType !== 'audio/mpeg') return null

  return {
    id,
    title,
    publishedAt,
    declaredDate,
    presenter: null,
    language: 'es',
    sourcePageUrl,
    audioUrl,
    mimeType,
    durationSeconds: parseDuration(item?.['itunes:duration'] ?? item?.duration),
  }
}

export function parseRpspFeed(xml) {
  if (typeof xml !== 'string' || !xml.trim()) return []

  const parser = new XMLParser({
    attributeNamePrefix: '@_',
    ignoreAttributes: false,
    parseTagValue: false,
    processEntities: false,
    removeNSPrefix: false,
    trimValues: true,
  })
  const document = parser.parse(xml)
  const rawItems = document?.rss?.channel?.item
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []
  return items.map(normalizeRssItem).filter(Boolean)
}

export function findRpspFeedEpisode(xml, { date, reference }) {
  return parseRpspFeed(xml).find((episode) => (
    episode.declaredDate === date && hasExactReference(episode.title, reference)
  )) ?? null
}

function readResponseText(response) {
  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_DOCUMENT_BYTES) {
    throw new Error('RPSP source document exceeds its size limit')
  }

  if (!response.body) return Promise.resolve('')

  return (async () => {
    const reader = response.body.getReader()
    const chunks = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_DOCUMENT_BYTES) {
          await reader.cancel()
          throw new Error('RPSP source document exceeds its size limit')
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }

    const merged = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.byteLength
    }
    return new TextDecoder().decode(merged)
  })()
}

function timeoutError(url) {
  const error = new Error(`RPSP request timed out: ${url}`)
  error.name = 'TimeoutError'
  return error
}

async function fetchWithTimeout(fetchImpl, url, options) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS)
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted) throw timeoutError(url)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchRpspDocument(url, {
  fetchImpl = fetch,
  headers = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  let currentUrl = validateDocumentUrl(url)
  if (!currentUrl) throw new Error('Rejected RPSP document URL')

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetchWithTimeout(fetchImpl, currentUrl, {
      headers,
      method: 'GET',
      redirect: 'manual',
      timeoutMs,
    })

    if (response.status === 304) return { response, text: null, url: currentUrl }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      const nextUrl = location ? new URL(location, currentUrl).toString() : null
      currentUrl = validateDocumentUrl(nextUrl)
      if (!currentUrl) throw new Error('Rejected RPSP redirect')
      continue
    }

    if (!response.ok) throw new Error(`RPSP source returned ${response.status}`)
    return { response, text: await readResponseText(response), url: currentUrl }
  }

  throw new Error('Too many RPSP redirects')
}

async function loadRpspFeed({ fetchImpl, timeoutMs } = {}) {
  const requestHeaders = {}
  if (rssMemory.etag) requestHeaders['If-None-Match'] = rssMemory.etag
  if (rssMemory.lastModified) requestHeaders['If-Modified-Since'] = rssMemory.lastModified

  const document = await fetchRpspDocument(RPSP_RSS_URL, {
    fetchImpl,
    headers: requestHeaders,
    timeoutMs,
  })

  if (document.response.status === 304) {
    if (!rssMemory.text) throw new Error('RPSP feed returned 304 without a cached document')
    return { text: rssMemory.text, url: document.url }
  }

  rssMemory = {
    etag: document.response.headers.get('etag'),
    lastModified: document.response.headers.get('last-modified'),
    text: document.text,
  }
  return { text: document.text, url: document.url }
}

export function getRpspFeed(options = {}) {
  if (options.fetchImpl) return loadRpspFeed(options)
  if (!sharedRssRequest) {
    sharedRssRequest = loadRpspFeed(options).finally(() => {
      sharedRssRequest = null
    })
  }
  return sharedRssRequest
}

function shiftDate(date, amount) {
  const [year, month, day] = date.split('-').map(Number)
  const stamp = Date.UTC(year, month - 1, day + amount)
  const shifted = new Date(stamp)
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`
}

export function createRpspWordpressCandidatesUrl(date) {
  const url = new URL(`https://${SOURCE_HOST}${WORDPRESS_PATH}`)
  url.searchParams.set('search', 'Reavivados')
  url.searchParams.set('after', `${shiftDate(date, -3)}T00:00:00`)
  url.searchParams.set('before', `${shiftDate(date, 1)}T00:00:00`)
  url.searchParams.set('per_page', '10')
  url.searchParams.set('_fields', 'id,date,date_gmt,link,title')
  return url.toString()
}

function wordpressPublishedAt(value) {
  const raw = cleanText(value, 40)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/u.test(raw)) return null
  const date = new Date(`${raw}Z`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function findRpspWordpressCandidate(json, { date, reference }) {
  if (!Array.isArray(json)) return { candidate: null, ambiguous: false }

  const candidates = json
    .filter((item) => String(item?.date ?? '').slice(0, 10) === date)
    .map((item) => ({
      id: cleanText(item?.id, 100),
      title: cleanText(item?.title?.rendered),
      publishedAt: wordpressPublishedAt(item?.date_gmt),
      sourcePageUrl: validateRpspSourcePageUrl(item?.link),
    }))
    .filter((item) => item.id && item.title && item.publishedAt && item.sourcePageUrl)
    .filter((item) => hasExactReference(item.title, reference))

  if (candidates.length !== 1) return { candidate: null, ambiguous: candidates.length > 1 }
  return { candidate: candidates[0], ambiguous: false }
}

export function extractRpspAudioUrl(html) {
  if (typeof html !== 'string') return null
  const source = /<(?:audio|source)\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/isu.exec(html)
  return validateRpspAudioUrl(source?.[2])
}

export function createRpspWordpressEpisode(candidate, audioUrl) {
  const validAudioUrl = validateRpspAudioUrl(audioUrl)
  const mimeType = inferMimeType(validAudioUrl)
  if (!candidate?.id || !candidate?.title || !candidate?.publishedAt || !candidate?.sourcePageUrl || !validAudioUrl || mimeType !== 'audio/mpeg') return null

  return {
    id: candidate.id,
    title: candidate.title,
    publishedAt: candidate.publishedAt,
    presenter: null,
    language: 'es',
    sourcePageUrl: candidate.sourcePageUrl,
    audioUrl: validAudioUrl,
    mimeType,
    durationSeconds: null,
  }
}

export function resetRpspFeedMemory() {
  rssMemory = { etag: null, lastModified: null, text: null }
  sharedRssRequest = null
}
