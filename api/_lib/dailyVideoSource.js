import { isVideoId, normalizeVideoDate, shiftVideoDate } from '../../src/features/daily-video/dailyVideoModel.js'

export const DAILY_VIDEO_SOURCE_ORIGIN = 'https://estediacondios.com'
export const DAILY_VIDEO_CHANNEL_URL = 'https://www.youtube.com/@EsteDiaConDios'
const WORDPRESS_PATH = '/wp-json/wp/v2/posts'
const MAX_DOCUMENT_BYTES = 1_000_000
const MAX_REDIRECTS = 2

function sourceUrl(value) {
  // Check the authority before URL normalization also removes explicit :443.
  if (typeof value !== 'string' || !value.startsWith(`${DAILY_VIDEO_SOURCE_ORIGIN}/`)) return null
  try {
    const url = new URL(value)
    if (url.origin !== DAILY_VIDEO_SOURCE_ORIGIN || url.username || url.password || url.port || url.hash || url.toString() !== value) return null
    return url
  } catch {
    return null
  }
}

export function validateDailyVideoSourcePageUrl(value, expectedDate) {
  const url = sourceUrl(value)
  if (!url || url.search) return null
  const match = /^\/(\d{4})\/(\d{2})\/(\d{2})\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/iu.exec(url.pathname)
  const date = match ? normalizeVideoDate(`${match[1]}-${match[2]}-${match[3]}`) : null
  if (!date || (expectedDate && date !== expectedDate)) return null
  return url.toString()
}

export function getDailyVideoHistoryStartDate(date) {
  if (!normalizeVideoDate(date)) throw new Error('Invalid daily video date')
  // The public date model starts at year 0001.
  return shiftVideoDate(date, -7) ?? '0001-01-01'
}

export function createDailyVideoPostsUrl(date, { history = false } = {}) {
  if (!normalizeVideoDate(date)) throw new Error('Invalid daily video date')
  const url = new URL(WORDPRESS_PATH, DAILY_VIDEO_SOURCE_ORIGIN)
  url.searchParams.set('after', `${history ? getDailyVideoHistoryStartDate(date) : date}T00:00:00`)
  url.searchParams.set('before', `${date}T${history ? '00:00:00' : '23:59:59'}`)
  url.searchParams.set('per_page', history ? '7' : '5')
  url.searchParams.set('orderby', 'date')
  url.searchParams.set('order', 'desc')
  url.searchParams.set('_fields', 'id,date,link,title')
  return url.toString()
}

function validDocumentUrl(value) {
  const url = sourceUrl(value)
  return url?.pathname === WORDPRESS_PATH ? url.toString() : validateDailyVideoSourcePageUrl(value)
}

function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') return ''
  const entities = { amp: '&', quot: '"', apos: "'", nbsp: ' ', lt: '<', gt: '>' }
  return value
    .replace(/<[^>]*>/gu, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|nbsp|lt|gt);/giu, (whole, entity) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? whole
      const code = entity[1].toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1))
      return code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : ''
    })
    .replace(/<[^>]*>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, maxLength)
}

function episodeTitle(raw) {
  const title = cleanText(raw)
  const number = /^#?(\d{1,4})(?:\s*[.\-–—:|]\s*|\s+)/u.exec(title)
  const withoutNumber = number ? title.slice(number[0].length) : title
  const resourceIndex = withoutNumber.search(/\bEste D[ií]a con Dios\b/iu)
  const cleanTitle = (resourceIndex < 0 ? withoutNumber : withoutNumber.slice(0, resourceIndex))
    .replace(/\s+(?:I|i)\s*$/u, '')
    .replace(/[\s|·:–—-]+$/u, '')
    .trim()
  const presenter = /\b(Pr\.?\s+[^|·]+)$/iu.exec(title)?.[1]?.trim().slice(0, 100) ?? null
  return { title: cleanTitle, episodeNumber: number ? Number(number[1]) : null, presenter }
}

export function normalizeDailyVideoPost(value) {
  if (!Number.isSafeInteger(value?.id) || value.id <= 0) return null
  if (typeof value?.date !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/u.test(value.date)) return null
  const contentDate = normalizeVideoDate(value.date.slice(0, 10))
  const sourcePageUrl = validateDailyVideoSourcePageUrl(value.link, contentDate)
  const metadata = episodeTitle(value.title?.rendered)
  if (!contentDate || !sourcePageUrl || !metadata.title) return null
  return { contentDate, sourcePostId: value.id, sourcePageUrl, ...metadata }
}

export function findDailyVideoPost(posts, date) {
  if (!Array.isArray(posts) || posts.length > 5) throw new Error('Invalid daily video publication response')
  // A non-empty, malformed or ambiguous response must never look unpublished.
  if (posts.length === 0) return { status: 'pending', post: null }
  const candidates = posts.map(normalizeDailyVideoPost)
  if (candidates.some((post) => !post || post.contentDate !== date) || candidates.length !== 1) {
    return { status: 'unavailable', post: null }
  }
  return { status: 'ready', post: candidates[0] }
}

export function normalizeDailyVideoHistory(posts, beforeDate) {
  if (!Array.isArray(posts) || posts.length > 7) throw new Error('Invalid daily video history response')
  const startDate = getDailyVideoHistoryStartDate(beforeDate)
  const candidates = posts.map(normalizeDailyVideoPost).filter((post) => post && post.contentDate >= startDate && post.contentDate < beforeDate)
  const uniqueDates = new Set()
  const duplicateDates = new Set()
  for (const post of candidates) {
    if (uniqueDates.has(post.contentDate)) duplicateDates.add(post.contentDate)
    uniqueDates.add(post.contentDate)
  }
  return candidates.filter((post) => !duplicateDates.has(post.contentDate)).map(({ contentDate, sourcePostId, episodeNumber, title, sourcePageUrl, presenter }) => ({
    contentDate, sourcePostId, episodeNumber, title, sourcePageUrl, presenter, videoId: null,
  })).sort((left, right) => right.contentDate.localeCompare(left.contentDate)).slice(0, 7)
}

export function extractDailyVideoId(html) {
  if (typeof html !== 'string') return null
  const ids = new Set()
  // Only iframe embed sources are evidence. Links, JSON and script text cannot
  // nominate a video, and multiple different embeds remain ambiguous.
  const markup = html.replace(/<!--[^]*?-->/gu, '').replace(/<(script|style)\b[^>]*>[^]*?<\/\1\s*>/giu, '')
  for (const iframe of markup.matchAll(/<iframe\b[^>]*>/giu)) {
    const match = /(?:\s)src\s*=\s*(["'])(.*?)\1/isu.exec(iframe[0])
    if (!match) continue
    try {
      const url = new URL(match[2].replace(/&amp;/giu, '&'))
      if (url.protocol !== 'https:' || url.username || url.password || url.port) continue
      if (!['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(url.hostname)) continue
      const id = /^\/embed\/([A-Za-z0-9_-]{11})\/?$/u.exec(url.pathname)?.[1]
      if (isVideoId(id)) ids.add(id)
    } catch {
      // Ignore unrelated, malformed iframe URLs.
    }
  }
  return ids.size === 1 ? [...ids][0] : null
}

function abortError() {
  const error = new Error('Daily video source request aborted or timed out')
  error.name = 'AbortError'
  return error
}

async function readDocument(response, signal) {
  const declaredSize = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredSize) && declaredSize > MAX_DOCUMENT_BYTES) {
    await response.body?.cancel()
    throw new Error('Daily video source document exceeds its size limit')
  }
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  const cancel = () => { void reader.cancel().catch(() => {}) }
  signal.addEventListener('abort', cancel, { once: true })
  try {
    while (true) {
      if (signal.aborted) throw abortError()
      const { done, value } = await reader.read()
      if (signal.aborted) throw abortError()
      if (done) break
      size += value.byteLength
      if (size > MAX_DOCUMENT_BYTES) {
        await reader.cancel()
        throw new Error('Daily video source document exceeds its size limit')
      }
      chunks.push(value)
    }
  } finally {
    signal.removeEventListener('abort', cancel)
    reader.releaseLock()
  }
  const result = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(result)
}

export async function fetchDailyVideoDocument(url, { fetchImpl = fetch, signal, timeoutMs = 8_000 } = {}) {
  let currentUrl = validDocumentUrl(url)
  if (!currentUrl) throw new Error('Rejected daily video source URL')
  const originalUrl = new URL(currentUrl)
  const controller = new AbortController()
  const abort = () => controller.abort()
  const timer = setTimeout(abort, Math.min(Math.max(timeoutMs, 1), 8_000))
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  let onAbort
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(abortError())
    controller.signal.addEventListener('abort', onAbort, { once: true })
    if (controller.signal.aborted) onAbort()
  })
  const load = async () => {
    for (let count = 0; count <= MAX_REDIRECTS; count += 1) {
      if (controller.signal.aborted) throw abortError()
      const response = await fetchImpl(currentUrl, {
        method: 'GET', redirect: 'manual', signal: controller.signal,
        headers: { Accept: originalUrl.pathname === WORDPRESS_PATH ? 'application/json' : 'text/html' },
      })
      if (controller.signal.aborted) {
        await response.body?.cancel()
        throw abortError()
      }
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel()
        const location = response.headers.get('location')
        const next = location ? validDocumentUrl(new URL(location, currentUrl).toString()) : null
        // Redirects may not switch from an API request to HTML or to another post.
        if (!next || new URL(next).pathname !== originalUrl.pathname) throw new Error('Rejected daily video source redirect')
        currentUrl = next
        continue
      }
      if (!response.ok) {
        await response.body?.cancel()
        throw new Error(`Daily video source returned ${response.status}`)
      }
      return { text: await readDocument(response, controller.signal), url: currentUrl }
    }
    throw new Error('Too many daily video source redirects')
  }
  try {
    return await Promise.race([load(), aborted])
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
    controller.signal.removeEventListener('abort', onAbort)
  }
}
