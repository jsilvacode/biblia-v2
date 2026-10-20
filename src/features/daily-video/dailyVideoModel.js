export const DAILY_VIDEO_CREATOR = 'Este Día con Dios'
export const DAILY_VIDEO_CHANNEL = 'https://www.youtube.com/@EsteDiaConDios'
export const DAILY_VIDEO_SOURCE = 'https://estediacondios.com/'

export function normalizeVideoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1) return null
  const candidate = new Date(`${value}T12:00:00.000Z`)
  return !Number.isNaN(candidate.getTime())
    && candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day ? value : null
}

export function getLocalVideoDate(value = new Date()) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null
  return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function isVideoId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/u.test(value)
}

export function createVideoPath(value = getLocalVideoDate()) {
  const date = normalizeVideoDate(value)
  return date ? `/este-dia-con-dios/${date}` : '/este-dia-con-dios'
}

export function shiftVideoDate(value, days) {
  const normalized = normalizeVideoDate(value)
  if (!normalized || !Number.isSafeInteger(days)) return null
  const date = new Date(`${normalized}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  if (Number.isNaN(date.getTime())) return null
  return normalizeVideoDate(date.toISOString().slice(0, 10))
}

export function formatVideoDate(value, locale = 'es', { compact = false } = {}) {
  const date = normalizeVideoDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: compact ? 'short' : 'long', ...(!compact && { year: 'numeric' }), timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00.000Z`))
}

export function isVideoSourcePage(value, date) {
  try {
    const url = new URL(value)
    return url.origin === 'https://estediacondios.com'
      && !url.username && !url.password && !url.hash && !url.search
      && url.pathname.startsWith(`/${date.replaceAll('-', '/')}/`)
      && /^\/\d{4}\/\d{2}\/\d{2}\/[a-zA-Z0-9%_-]+\/$/u.test(url.pathname)
  } catch {
    return false
  }
}
