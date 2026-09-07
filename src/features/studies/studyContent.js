import manifest from '../../content/la-fe-de-jesus/manifest.json'

const lessonModules = import.meta.glob('../../content/la-fe-de-jesus/generated/*.json', {
  import: 'default',
})
const lessonCache = new Map()
const lessonRequests = new Map()

export const studyLessons = manifest.map((entry, index) => ({
  id: entry.id,
  next: manifest[index + 1]?.slug ?? null,
  order: entry.id,
  previous: manifest[index - 1]?.slug ?? null,
  slug: entry.slug,
  sourceUrl: entry.source_url,
  summary: entry.summary,
  title: entry.title,
}))

const lessonsBySlug = new Map(studyLessons.map((lesson) => [lesson.slug, lesson]))
const loadersBySlug = new Map(Object.entries(lessonModules).map(([path, loader]) => {
  const fileName = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/u, '')
  return [fileName.replace(/^\d{2}-/u, ''), loader]
}))

export function getStudyLesson(slug) {
  return lessonsBySlug.get(slug) ?? null
}

export function loadStudyLesson(slug) {
  if (!lessonsBySlug.has(slug)) return Promise.resolve(null)
  if (lessonCache.has(slug)) return Promise.resolve(lessonCache.get(slug))
  if (lessonRequests.has(slug)) return lessonRequests.get(slug)

  const loader = loadersBySlug.get(slug)
  if (!loader) return Promise.reject(new Error(`No se encontró el contenido de ${slug}.`))
  const request = loader()
    .then((lesson) => {
      lessonCache.set(slug, lesson)
      return lesson
    })
    .finally(() => lessonRequests.delete(slug))
  lessonRequests.set(slug, request)
  return request
}
