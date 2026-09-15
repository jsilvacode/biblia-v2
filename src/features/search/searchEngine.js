export const SEARCH_PAGE_SIZE = 50

export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeSnippet(text, normalizedText, terms) {
  const index = terms
    .map((term) => normalizedText.indexOf(term))
    .find((termIndex) => termIndex >= 0) ?? -1
  if (index < 0 || text.length <= 170) return text

  const start = Math.max(0, index - 62)
  const end = Math.min(text.length, index + terms[0].length + 92)
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

function getPagination(pagination = {}) {
  const { limit = SEARCH_PAGE_SIZE, offset = 0 } = typeof pagination === 'number'
    ? { limit: pagination }
    : pagination
  const parsedLimit = Number.parseInt(limit, 10)
  const parsedOffset = Number.parseInt(offset, 10)

  return {
    limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : SEARCH_PAGE_SIZE,
    offset: Number.isInteger(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0,
  }
}

function hasEveryTerm(normalizedText, terms) {
  const words = ` ${normalizedText} `
  return terms.every((term) => words.includes(` ${term} `))
}

export function prepareSearchEntries(entries) {
  return entries.map(([book, chapter, verse, text]) => [
    book,
    chapter,
    verse,
    text,
    normalizeSearchText(text),
  ])
}

export function searchEntries(entries, query, pagination) {
  const normalizedQuery = normalizeSearchText(query)
  const { limit, offset } = getPagination(pagination)
  if (!normalizedQuery) return { results: [], total: 0, offset, limit, hasMore: false }

  const terms = normalizedQuery.split(' ')
  const results = []
  let total = 0

  for (const [book, chapter, verse, text, preparedText] of entries) {
    const normalizedText = preparedText ?? normalizeSearchText(text)
    if (!hasEveryTerm(normalizedText, terms)) continue

    if (total >= offset && results.length < limit) {
      results.push({ book, chapter, verse, text: makeSnippet(text, normalizedText, terms) })
    }
    total += 1
  }

  return {
    results,
    total,
    offset,
    limit,
    hasMore: offset + results.length < total,
  }
}
