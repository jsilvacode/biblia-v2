import { getRpspReadingByDay } from './rpsp2026.js'

const RPSP_YEAR = 2026
const DAY_IN_MS = 86_400_000
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u
const planStart = Date.UTC(RPSP_YEAR, 0, 1)
const planEnd = Date.UTC(RPSP_YEAR, 11, 31)

function exactCalendarDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

/** Parses a civil date without allowing UTC conversion to change its calendar day. */
export function parseRpspDate(value) {
  const match = DATE_PATTERN.exec(String(value ?? ''))
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!exactCalendarDate(year, month, day)) return null

  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    year,
    month,
    day,
  }
}

/** Returns the calendar reference for an already normalized YYYY-MM-DD date. */
export function getRpspReadingForDate(value) {
  const parsed = parseRpspDate(value)
  if (!parsed) return { status: 'invalid_date', date: null, reference: null, reading: null }

  const stamp = Date.UTC(parsed.year, parsed.month - 1, parsed.day)
  if (stamp < planStart || stamp > planEnd) {
    return { status: 'out_of_calendar', date: parsed.date, reference: null, reading: null }
  }

  const day = Math.floor((stamp - planStart) / DAY_IN_MS) + 1
  const reading = getRpspReadingByDay(day)
  if (!reading) return { status: 'out_of_calendar', date: parsed.date, reference: null, reading: null }

  return {
    status: 'active',
    date: parsed.date,
    reference: { book: reading.book, chapter: reading.chapter },
    reading,
  }
}

/** Formats a local browser Date as a civil key for the Reavivados calendar. */
export function getLocalRpspDate(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null

  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
