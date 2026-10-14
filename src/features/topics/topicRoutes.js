import { getTopicSituations } from './topicSearch'

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
