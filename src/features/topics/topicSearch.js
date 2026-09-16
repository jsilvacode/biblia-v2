import { normalizeText } from '../bible/catalog'

function searchableText(value) {
  return normalizeText(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function compactText(value) {
  return searchableText(value).replace(/\s+/g, '')
}

export function tokenizeTopicQuery(query) {
  return searchableText(query).split(/\s+/).filter(Boolean)
}

export function getTopicSituations(topicLibrary) {
  return topicLibrary.categories.flatMap((category) => (
    category.situations.map((situation) => ({
      ...situation,
      categoryId: category.id,
      categoryNumber: category.number,
      categoryTitle: category.title,
    }))
  ))
}

export function matchesTopicQuery(situation, query) {
  const tokens = tokenizeTopicQuery(query)
  if (!tokens.length) return true

  const values = [
    situation.title,
    situation.categoryTitle,
    situation.central,
    ...situation.companions,
  ]
  const haystack = searchableText(values.join(' '))
  const compactHaystack = compactText(values.join(' '))
  const compactQuery = compactText(query)

  if (compactQuery && compactHaystack.includes(compactQuery)) return true
  return tokens.every((token) => haystack.includes(token))
}

export function filterTopicSituations(situations, { categoryId, query } = {}) {
  return situations.filter((situation) => (
    (!categoryId || situation.categoryId === categoryId)
    && matchesTopicQuery(situation, query)
  ))
}
