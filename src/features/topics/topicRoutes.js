import { getTopicSituations } from './topicSearch'

export const TOPICS_INDEX_PATH = '/topics'

function toSearchString(searchParams) {
  const value = searchParams instanceof URLSearchParams
    ? searchParams.toString()
    : new URLSearchParams(searchParams ?? '').toString()
  return value ? `?${value}` : ''
}

export function createTopicsIndexPath(searchParams) {
  const next = new URLSearchParams(searchParams ?? '')
  next.delete('reading')
  return `${TOPICS_INDEX_PATH}${toSearchString(next)}`
}

export function createTopicDetailPath({ categoryId, situationId, searchParams }) {
  return `${TOPICS_INDEX_PATH}/${encodeURIComponent(categoryId)}/${encodeURIComponent(situationId)}${toSearchString(searchParams)}`
}

export function createCompanionId(index) {
  return `companion-${index + 1}`
}

export function resolveTopicCompanion(reading, companions) {
  if (!reading) return { index: null, isValid: true }

  const match = /^companion-(\d+)$/u.exec(reading)
  const index = match ? Number(match[1]) - 1 : -1
  if (index < 0 || index >= companions.length) return { index: null, isValid: false }

  return { index, isValid: true }
}

export function findTopicSituation(topicLibrary, { categoryId, situationId }) {
  return getTopicSituations(topicLibrary).find((situation) => (
    situation.categoryId === categoryId && situation.id === situationId
  )) ?? null
}

export function findTopicSituationByLegacyHash(topicLibrary, hash) {
  let id
  try {
    id = decodeURIComponent(String(hash ?? '').replace(/^#/u, ''))
  } catch {
    return null
  }
  if (!id.startsWith('topic-')) return null

  return getTopicSituations(topicLibrary).find((situation) => (
    id === `topic-${situation.categoryId}-${situation.id}`
  )) ?? null
}
