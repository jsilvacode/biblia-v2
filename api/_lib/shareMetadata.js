import books from '../../src/features/bible/data/books.json'
import versions from '../../src/features/bible/data/versions.json'
import { getLocalizedBookName } from '../../src/features/bible/bookNames.js'

const APP_QUOTE = 'Lámpara es a mis pies Tu palabra, y luz para mi camino.'
const APP_REFERENCE = 'Salmos 119:105'
const DEFAULT_VERSION = 'nbla'
const MAX_SHARED_VERSES = 12
const SOCIAL_CARD_REVISION = '9'
const SHARE_META_PATTERN = /<!-- share-meta:start -->[\s\S]*?<!-- share-meta:end -->/u

const localeTags = {
  en: 'en_US',
  es: 'es_ES',
  'pt-BR': 'pt_BR',
}

export class ShareMetadataError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'ShareMetadataError'
    this.status = status
  }
}

function firstHeaderValue(value) {
  return String(Array.isArray(value) ? value[0] : (value ?? '')).split(',')[0].trim()
}

function readHeader(headers, name) {
  if (typeof headers?.get === 'function') return headers.get(name)
  return headers?.[name]
}

function getQueryValue(query, name) {
  const value = query?.[name]
  return Array.isArray(value) ? value[0] : value
}

function parsePositiveInteger(value, label) {
  const raw = String(value ?? '')
  if (!/^\d{1,3}$/u.test(raw)) throw new ShareMetadataError(`${label} inválido.`)
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new ShareMetadataError(`${label} inválido.`)
  return parsed
}

function normalizeLocale(value) {
  return Object.hasOwn(localeTags, value) ? value : 'es'
}

function normalizeVersion(value) {
  const requested = String(value || DEFAULT_VERSION)
  const version = versions.find((item) => item.available && item.id === requested)
  if (!version) throw new ShareMetadataError('Versión bíblica inválida.')
  return version
}

function normalizeVerseText(value) {
  return String(value ?? '')
    .replace(/^\s*¶\s*/u, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(/^[«»“”"]+\s*/u, '')
    .replace(/\s*[«»“”"]+(?=[.?!…]*$)/u, '')
}

export function truncateShareText(value, maximum = 210) {
  const text = normalizeVerseText(value)
  if (text.length <= maximum) return text
  const candidate = text.slice(0, maximum - 1)
  const lastSpace = candidate.lastIndexOf(' ')
  return `${candidate.slice(0, lastSpace > maximum * 0.72 ? lastSpace : candidate.length).trimEnd()}…`
}

export function getRequestOrigin(request) {
  let requestUrl
  try {
    requestUrl = request?.url ? new URL(request.url) : undefined
  } catch {
    requestUrl = undefined
  }

  const forwardedHost = firstHeaderValue(readHeader(request?.headers, 'x-forwarded-host'))
  const host = forwardedHost
    || firstHeaderValue(readHeader(request?.headers, 'host'))
    || requestUrl?.host
  if (!host || !/^[a-z0-9.-]+(?::\d{1,5})?$/iu.test(host)) {
    throw new ShareMetadataError('Host inválido.', 400)
  }

  const forwardedProtocol = firstHeaderValue(readHeader(request?.headers, 'x-forwarded-proto'))
  const localHost = /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/iu.test(host)
  const protocol = forwardedProtocol === 'http' || forwardedProtocol === 'https'
    ? forwardedProtocol
    : (requestUrl?.protocol === 'http:' || requestUrl?.protocol === 'https:'
        ? requestUrl.protocol.slice(0, -1)
        : (localHost ? 'http' : 'https'))

  return `${protocol}://${host}`
}

export function parseVerseShareQuery(query = {}) {
  const bookId = parsePositiveInteger(getQueryValue(query, 'book'), 'Libro')
  const chapter = parsePositiveInteger(getQueryValue(query, 'chapter'), 'Capítulo')
  const verseStart = parsePositiveInteger(getQueryValue(query, 'verse'), 'Versículo')
  const rawEnd = getQueryValue(query, 'end')
  const verseEnd = rawEnd ? parsePositiveInteger(rawEnd, 'Fin del rango') : verseStart
  const locale = normalizeLocale(String(getQueryValue(query, 'lang') || 'es'))
  const version = normalizeVersion(getQueryValue(query, 'v') || getQueryValue(query, 'version'))

  if (verseEnd < verseStart || verseEnd - verseStart + 1 > MAX_SHARED_VERSES) {
    throw new ShareMetadataError('Rango de versículos inválido.')
  }

  const book = books.find((item) => item.id === bookId)
  if (!book || chapter > book.chapters) throw new ShareMetadataError('Referencia bíblica inválida.', 404)

  return { book, chapter, locale, verseEnd, verseStart, version }
}

function buildReaderUrl(origin, parsed) {
  const url = new URL(`/read/${parsed.book.id}/${parsed.chapter}/${parsed.verseStart}`, origin)
  url.searchParams.set('v', parsed.version.id)
  if (parsed.verseEnd > parsed.verseStart) url.searchParams.set('end', String(parsed.verseEnd))
  if (parsed.locale !== 'es') url.searchParams.set('lang', parsed.locale)
  return url.toString()
}

function buildImageUrl(origin, parsed) {
  const url = new URL('/api/og-card', origin)
  url.searchParams.set('type', 'verse')
  url.searchParams.set('book', String(parsed.book.id))
  url.searchParams.set('chapter', String(parsed.chapter))
  url.searchParams.set('verse', String(parsed.verseStart))
  url.searchParams.set('v', parsed.version.id)
  if (parsed.verseEnd > parsed.verseStart) url.searchParams.set('end', String(parsed.verseEnd))
  if (parsed.locale !== 'es') url.searchParams.set('lang', parsed.locale)
  url.searchParams.set('card', SOCIAL_CARD_REVISION)
  return url.toString()
}

export async function loadVerseShareMetadata({ fetchImpl = fetch, origin, query }) {
  const parsed = parseVerseShareQuery(query)
  const chapterUrl = new URL(
    `/data/${parsed.version.id}/${parsed.book.file}/${parsed.chapter}.json`,
    origin,
  )
  const response = await fetchImpl(chapterUrl)
  if (!response.ok) throw new ShareMetadataError('No fue posible cargar el texto compartido.', 502)

  const chapter = await response.json()
  if (!Array.isArray(chapter)) throw new ShareMetadataError('El capítulo compartido no es válido.', 502)
  const verses = chapter.filter(({ verse }) => verse >= parsed.verseStart && verse <= parsed.verseEnd)
  if (verses.length !== parsed.verseEnd - parsed.verseStart + 1) {
    throw new ShareMetadataError('El versículo compartido no existe.', 404)
  }

  const text = verses.map(({ text: verseText }) => normalizeVerseText(verseText)).join(' ')
  const bookName = getLocalizedBookName(parsed.book, parsed.locale)
  const range = parsed.verseEnd > parsed.verseStart
    ? `${parsed.verseStart}-${parsed.verseEnd}`
    : String(parsed.verseStart)
  const reference = `${bookName} ${parsed.chapter}:${range}`
  const citation = `${reference} · ${parsed.version.short}`

  return {
    canonicalUrl: buildReaderUrl(origin, parsed),
    citation,
    description: truncateShareText(text),
    imageAlt: `Tarjeta de ${reference} en Santa Biblia`,
    imageType: 'image/png',
    imageUrl: buildImageUrl(origin, parsed),
    locale: localeTags[parsed.locale],
    reference,
    text,
    title: `${reference} | Santa Biblia`,
    type: 'article',
  }
}

export function createAppShareMetadata(origin) {
  const imageUrl = new URL(`/og-share.jpg?v=${SOCIAL_CARD_REVISION}`, origin).toString()
  return {
    canonicalUrl: new URL('/', origin).toString(),
    citation: APP_REFERENCE,
    description: `${APP_QUOTE} — ${APP_REFERENCE}`,
    imageAlt: 'Una Biblia abierta frente a un paisaje sereno al amanecer',
    imageType: 'image/jpeg',
    imageUrl,
    locale: localeTags.es,
    reference: APP_REFERENCE,
    text: APP_QUOTE,
    title: 'Santa Biblia',
    type: 'website',
  }
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
}

export function renderShareMetadata(metadata) {
  const value = Object.fromEntries(
    Object.entries(metadata).map(([key, entry]) => [key, escapeHtmlAttribute(entry)]),
  )
  return `<!-- share-meta:start -->
    <meta name="application-name" content="Santa Biblia" />
    <meta name="description" content="${value.description}" />
    <link rel="canonical" href="${value.canonicalUrl}" />
    <meta property="og:type" content="${value.type}" />
    <meta property="og:locale" content="${value.locale}" />
    <meta property="og:site_name" content="Santa Biblia" />
    <meta property="og:url" content="${value.canonicalUrl}" />
    <meta property="og:title" content="${value.title}" />
    <meta property="og:description" content="${value.description}" />
    <meta property="og:image" content="${value.imageUrl}" />
    <meta property="og:image:secure_url" content="${value.imageUrl}" />
    <meta property="og:image:type" content="${value.imageType}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${value.imageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${value.title}" />
    <meta name="twitter:description" content="${value.description}" />
    <meta name="twitter:image" content="${value.imageUrl}" />
    <meta name="twitter:image:alt" content="${value.imageAlt}" />
    <title>${value.title}</title>
    <!-- share-meta:end -->`
}

export function injectShareMetadata(html, metadata) {
  const tags = renderShareMetadata(metadata)
  if (!SHARE_META_PATTERN.test(html)) throw new ShareMetadataError('La plantilla HTML no contiene metadatos reemplazables.', 500)
  return html.replace(SHARE_META_PATTERN, tags)
}
