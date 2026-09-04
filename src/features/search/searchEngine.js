export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function makeSnippet(text, normalizedQuery) {
  const normalizedText = normalizeSearchText(text)
  const index = normalizedText.indexOf(normalizedQuery)
  if (index < 0 || text.length <= 170) return text

  const start = Math.max(0, index - 62)
  const end = Math.min(text.length, index + normalizedQuery.length + 92)
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

export function searchEntries(entries, query, limit = 100) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []

  const terms = normalizedQuery.split(' ')
  const results = []

  for (const [book, chapter, verse, text] of entries) {
    const normalizedText = normalizeSearchText(text)
    if (!terms.every((term) => normalizedText.includes(term))) continue
    results.push({ book, chapter, verse, text: makeSnippet(text, normalizedQuery) })
    if (results.length === limit) break
  }

  return results
}
