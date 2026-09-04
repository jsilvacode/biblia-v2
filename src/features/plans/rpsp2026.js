const DAY_IN_MS = 86_400_000

export const RPSP_2026_TOTAL_DAYS = 365

// Reavivados por su Palabra continues canonically from 1 Samuel 24 on
// 1 January 2026 through Psalm 146 on 31 December 2026.
const sequence = Object.freeze([
  { book: 9, from: 24, to: 31 },
  { book: 10, from: 1, to: 24 },
  { book: 11, from: 1, to: 22 },
  { book: 12, from: 1, to: 25 },
  { book: 13, from: 1, to: 29 },
  { book: 14, from: 1, to: 36 },
  { book: 15, from: 1, to: 10 },
  { book: 16, from: 1, to: 13 },
  { book: 17, from: 1, to: 10 },
  { book: 18, from: 1, to: 42 },
  { book: 19, from: 1, to: 146 },
])

function calendarStamp(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

const planStartStamp = Date.UTC(2026, 0, 1)
const planEndStamp = Date.UTC(2026, 11, 31)

export function getRpspReadingByDay(day) {
  if (!Number.isInteger(day) || day < 1 || day > RPSP_2026_TOTAL_DAYS) return null

  let remaining = day - 1
  for (const block of sequence) {
    const chapters = block.to - block.from + 1
    if (remaining < chapters) {
      const chapter = block.from + remaining
      return {
        book: block.book,
        chapter,
        day,
        total: RPSP_2026_TOTAL_DAYS,
        date: new Date(2026, 0, day, 12),
      }
    }
    remaining -= chapters
  }

  return null
}

export function getRpspReading(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const stamp = calendarStamp(date)
  if (stamp < planStartStamp || stamp > planEndStamp) return null
  const day = Math.floor((stamp - planStartStamp) / DAY_IN_MS) + 1
  return getRpspReadingByDay(day)
}

export function getRpspPlanState(date = new Date()) {
  const reading = getRpspReading(date)
  if (reading) return { status: 'active', reading }

  if (calendarStamp(date) < planStartStamp) {
    return { status: 'upcoming', reading: getRpspReadingByDay(1) }
  }

  return { status: 'completed', reading: getRpspReadingByDay(RPSP_2026_TOTAL_DAYS) }
}

export function getRpspReadingWindow(day, count = 7) {
  if (!Number.isInteger(day) || !Number.isInteger(count) || count < 1) return []
  const firstDay = Math.min(Math.max(day, 1), RPSP_2026_TOTAL_DAYS)
  return Array.from({ length: count }, (_, index) => getRpspReadingByDay(firstDay + index)).filter(Boolean)
}
