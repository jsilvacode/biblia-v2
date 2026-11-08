import books from '../../src/features/bible/data/books.json' with { type: 'json' }
import { getRpspReadingForDate } from '../../src/features/plans/rpspDate.js'
import { resolveRpspMetadata } from '../rpsp.js'
import { createAppShareMetadata, ShareMetadataError } from './shareMetadata.js'

const RESOURCE_NAME = 'Reavivados por su Palabra'
const SHARE_TIMEOUT_MS = 5000

function shareReading(date) {
  const plan = getRpspReadingForDate(date)
  if (plan.status === 'invalid_date') throw new ShareMetadataError('Fecha de reflexión inválida.', 400)
  if (plan.status !== 'active') throw new ShareMetadataError('La fecha no pertenece al calendario de Reavivados.', 404)
  const book = books.find((entry) => entry.id === plan.reference.book)
  if (!book) throw new ShareMetadataError('Referencia de reflexión inválida.', 400)
  return {
    contentDate: plan.date,
    dateLabel: new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${plan.date}T12:00:00Z`)),
    reference: `${book.name} ${plan.reference.chapter}`,
    reading: plan.reference,
  }
}

export function createRpspFallbackMetadata({ origin, date }) {
  let reading
  try { reading = shareReading(date) } catch { /* The invalid-date SPA remains available. */ }
  const description = reading
    ? `${RESOURCE_NAME} del ${reading.dateLabel}. Lee ${reading.reference} y encuentra su reflexión en audio en Santa Biblia.`
    : `Lectura bíblica y reflexión en audio de ${RESOURCE_NAME} en Santa Biblia.`
  return {
    ...createAppShareMetadata(origin),
    canonicalUrl: new URL(reading ? `/reavivados/${reading.contentDate}` : '/reavivados', origin).toString(),
    description,
    reference: reading?.reference ?? RESOURCE_NAME,
    text: description,
    title: `${reading ? `${reading.reference} · ` : ''}${RESOURCE_NAME} | Santa Biblia`,
    type: 'article',
  }
}

export function createRpspShareMetadata({ origin, date, metadata }) {
  const reading = shareReading(date)
  if (metadata?.status !== 'ready') throw new ShareMetadataError('La reflexión aún no está disponible.', 503)
  const episode = metadata.episode
  if (metadata.date !== reading.contentDate
    || metadata.reference?.book !== reading.reading.book
    || metadata.reference?.chapter !== reading.reading.chapter
    || typeof episode?.title !== 'string' || !episode.title.trim()) {
    throw new ShareMetadataError('La reflexión compartida no es válida.', 502)
  }
  const episodeTitle = episode.title.split('|').map(part => part.trim()).find(Boolean)
  if (!episodeTitle) throw new ShareMetadataError('La reflexión compartida no es válida.', 502)
  const description = `${reading.reference} · ${reading.dateLabel}. ${episodeTitle}. Escucha la reflexión y lee el capítulo en Santa Biblia.`
  const imageUrl = new URL('/api/og-card', origin)
  imageUrl.searchParams.set('type', 'rpsp')
  imageUrl.searchParams.set('date', reading.contentDate)
  return {
    canonicalUrl: new URL(`/reavivados/${reading.contentDate}`, origin).toString(),
    citation: `${reading.reference} · ${reading.dateLabel}`,
    contentDate: reading.contentDate,
    dateLabel: reading.dateLabel,
    description,
    episodeTitle,
    audioDurationSeconds: episode.durationSeconds ?? null,
    imageAlt: `${episodeTitle} · ${reading.reference} · ${reading.dateLabel}`,
    imageHeight: 630,
    imageType: 'image/jpeg',
    imageUrl: imageUrl.toString(),
    imageWidth: 1200,
    locale: 'es_ES',
    reference: reading.reference,
    text: episodeTitle,
    title: `${episodeTitle} | ${reading.reference} · ${RESOURCE_NAME}`,
    type: 'article',
  }
}

export async function loadRpspShareMetadata({
  origin,
  date,
  fetchImpl = fetch,
  now,
  resolveMetadata = resolveRpspMetadata,
  timeoutMs = SHARE_TIMEOUT_MS,
}) {
  const reading = shareReading(date)
  const budgetMs = Math.min(Math.max(timeoutMs, 1), SHARE_TIMEOUT_MS)
  const controller = new AbortController()
  const boundedFetch = (url, options = {}) => {
    if (controller.signal.aborted) return Promise.reject(controller.signal.reason)
    const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal
    return fetchImpl(url, { ...options, signal })
  }
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new ShareMetadataError('La reflexión tardó demasiado en responder.', 504))
    }, budgetMs)
  })
  try {
    const metadata = await Promise.race([
      resolveMetadata({ date: reading.contentDate, fetchImpl: boundedFetch, now }),
      timeout,
    ])
    return createRpspShareMetadata({ origin, date: reading.contentDate, metadata })
  } finally {
    clearTimeout(timeoutId)
  }
}
