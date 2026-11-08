import { formatReference } from '../bible/catalog.js'
import { getRpspReadingForDate } from './rpspDate.js'

const PUBLIC_ORIGIN = 'https://www.santabiblia.cloud'
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function shareOrigin(origin) {
  try {
    const candidate = new URL(origin)
    if (['http:', 'https:'].includes(candidate.protocol) && LOCAL_HOSTS.has(candidate.hostname)) return candidate.origin
  } catch { /* Keep shared capsules on the official public host. */ }
  return PUBLIC_ORIGIN
}

function hasOfficialAudio(episode) {
  try {
    const url = new URL(episode?.audioUrl)
    return url.protocol === 'https:' && url.hostname === 'vod.nuevotiempo.org'
      && !url.username && !url.password && !url.port && url.pathname !== '/'
  } catch {
    return false
  }
}

export function createRpspAudioShareData(options = {}) {
  const { date, episode, origin, locale = 'es' } = options ?? {}
  const plan = getRpspReadingForDate(date)
  const normalizedTitle = typeof episode?.title === 'string' ? episode.title.replace(/\s+/gu, ' ').trim() : ''
  const title = normalizedTitle.split('|').map((part) => part.trim()).find(Boolean) ?? ''
  if (plan.status !== 'active' || !title || !hasOfficialAudio(episode)) return null

  const reference = formatReference(plan.reference, locale)
  return {
    title: `${title} · ${reference} | Reavivados por su Palabra`,
    text: `${title}\n${reference} · Reavivados por su Palabra`,
    url: new URL(`/reavivados/${plan.date}`, shareOrigin(origin)).toString(),
  }
}

export async function shareRpspAudio(options) {
  const data = createRpspAudioShareData(options)
  if (!data || typeof navigator === 'undefined') return 'unavailable'

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: data.title, text: data.url })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
    }
  }

  try {
    if (typeof navigator.clipboard?.writeText !== 'function') return 'unavailable'
    await navigator.clipboard.writeText(data.url)
    return 'copied'
  } catch {
    return 'unavailable'
  }
}
