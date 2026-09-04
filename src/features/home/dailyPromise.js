import promises from './data/dailyPromises.json'
import { formatReference } from '../bible/catalog'

function toLocalKey(month, day) {
  return `${month}-${day}`
}

const promiseByDate = new Map(promises.map((promise) => [toLocalKey(promise.month, promise.day), promise]))

export function getLocalCalendarDate(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const month = date.getMonth() + 1
  const day = date.getDate()
  return { month, day, key: toLocalKey(month, day) }
}

export function getDailyPromise(date = new Date()) {
  const localDate = getLocalCalendarDate(date)
  if (!localDate) return null
  const key = localDate.month === 2 && localDate.day === 29
    ? toLocalKey(2, 28)
    : localDate.key
  return promiseByDate.get(key) ?? null
}

export function formatPromiseReference(promise, locale = 'es') {
  if (!promise) return ''
  const { reference } = promise
  const prefix = formatReference({
    book: reference.book,
    chapter: reference.chapter,
    verse: reference.verseStart,
  }, locale)
  return reference.verseEnd > reference.verseStart
    ? `${prefix}-${reference.verseEnd}`
    : prefix
}

export function getPromiseVerses(chapter, promise) {
  if (!promise || !Array.isArray(chapter)) return []
  const { verseStart, verseEnd } = promise.reference
  return chapter
    .filter((item) => item.verse >= verseStart && item.verse <= verseEnd)
    .map((item) => ({ ...item, text: String(item.text ?? '').replace(/^\s*¶\s*/u, '') }))
}

export function getPromiseText(chapter, promise) {
  const excerpt = getPromiseVerses(chapter, promise).map((item) => item.text).join(' ').trim()
  // Some source editions split direct speech across verses. The hero is a
  // standalone excerpt, so boundary guillemets are kept only when they form a
  // balanced pair inside the selected range.
  let text = excerpt.replace(/^»+\s*/u, '')
  const count = (mark) => [...text.matchAll(new RegExp(mark, 'gu'))].length

  while (count('»') > count('«') && /»(?=[.?!…]*$)/u.test(text)) {
    text = text.replace(/»(?=[.?!…]*$)/u, '')
  }
  while (count('«') > count('»') && /^«/u.test(text)) {
    text = text.replace(/^«+\s*/u, '')
  }

  return text.trim()
}
