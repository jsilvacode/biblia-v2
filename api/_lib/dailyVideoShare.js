import {
  createVideoPath,
  formatVideoDate,
  isVideoId,
  normalizeVideoDate,
} from '../../src/features/daily-video/dailyVideoModel.js'
import { resolveDailyVideoMetadata } from '../daily-video.js'
import { createAppShareMetadata, ShareMetadataError } from './shareMetadata.js'

const SHARE_TIMEOUT_MS = 3500
const RESOURCE_NAME = 'Este Día con Dios'

export function createDailyVideoFallbackMetadata({ origin, date }) {
  const contentDate = normalizeVideoDate(date)
  const dateLabel = contentDate ? formatVideoDate(contentDate, 'es') : ''
  const description = dateLabel
    ? `Cápsula del ${dateLabel} de Este Día con Dios. Reproduce el video y compártelo desde Santa Biblia.`
    : 'Un momento de reflexión con las cápsulas de Este Día con Dios en Santa Biblia.'

  return {
    ...createAppShareMetadata(origin),
    canonicalUrl: new URL(createVideoPath(contentDate), origin).toString(),
    description,
    imageAlt: 'Santa Biblia · Este Día con Dios',
    reference: dateLabel,
    text: description,
    title: `${RESOURCE_NAME}${dateLabel ? ` · ${dateLabel}` : ''} | Santa Biblia`,
    type: 'article',
  }
}

export function createDailyVideoShareMetadata({ origin, date, episode }) {
  const contentDate = normalizeVideoDate(date)
  if (!contentDate || episode?.contentDate !== contentDate || !isVideoId(episode?.videoId)
    || typeof episode?.title !== 'string' || !episode.title.trim()) {
    throw new ShareMetadataError('La cápsula compartida no es válida.', 502)
  }

  const dateLabel = formatVideoDate(contentDate, 'es')
  const creator = episode.creator || RESOURCE_NAME
  const credit = [creator, episode.presenter].filter(Boolean).join(' · ')
  const description = `Cápsula del ${dateLabel}. ${credit}. Reprodúcela en Santa Biblia.`

  return {
    canonicalUrl: new URL(createVideoPath(contentDate), origin).toString(),
    citation: credit,
    description,
    imageAlt: `${episode.title} · ${RESOURCE_NAME} · ${dateLabel}`,
    imageHeight: 360,
    imageType: 'image/jpeg',
    imageUrl: `https://i.ytimg.com/vi/${episode.videoId}/hqdefault.jpg`,
    imageWidth: 480,
    locale: 'es_ES',
    reference: dateLabel,
    text: description,
    title: `${episode.title} | ${RESOURCE_NAME} · Santa Biblia`,
    type: 'article',
  }
}

export async function loadDailyVideoShareMetadata({
  origin,
  date,
  fetchImpl = fetch,
  now,
  resolveMetadata = resolveDailyVideoMetadata,
  timeoutMs = SHARE_TIMEOUT_MS,
}) {
  const contentDate = normalizeVideoDate(date)
  if (!contentDate) throw new ShareMetadataError('Fecha de cápsula inválida.', 400)

  const budgetMs = Math.min(Math.max(timeoutMs, 1), SHARE_TIMEOUT_MS)
  const controller = new AbortController()
  let timeoutId
  // A social crawler must still receive the SPA if the provider stalls. The
  // resolver gets a shorter budget to return its verified snapshot on failure.
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(new ShareMetadataError('La cápsula tardó demasiado en responder.', 504))
    }, budgetMs)
  })

  try {
    const result = await Promise.race([
      resolveMetadata({
        date: contentDate,
        fetchImpl,
        now,
        signal: controller.signal,
        timeoutMs: Math.max(1, budgetMs - 250),
      }),
      timeout,
    ])
    if (result?.status !== 'ready') {
      throw new ShareMetadataError('La cápsula aún no está disponible.', 503)
    }
    return createDailyVideoShareMetadata({ origin, date: contentDate, episode: result.episode })
  } finally {
    clearTimeout(timeoutId)
  }
}
