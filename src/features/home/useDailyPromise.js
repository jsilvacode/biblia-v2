import { useEffect, useState } from 'react'
import { loadChapter } from '../bible/bibleRepository'
import { getDailyPromise, getPromiseText, getPromiseVerses } from './dailyPromise'
import { useLocalDay } from './useLocalDay'

export function useDailyPromise(versionId) {
  const localDay = useLocalDay()
  const promise = getDailyPromise(new Date())
  const [result, setResult] = useState({ key: null, status: 'loading', chapter: [] })
  const requestKey = promise ? `${versionId}:${promise.reference.book}:${promise.reference.chapter}:${localDay?.key}` : null

  useEffect(() => {
    if (!promise || !requestKey) return undefined
    const controller = new AbortController()
    loadChapter({
      versionId,
      bookId: promise.reference.book,
      chapter: promise.reference.chapter,
      signal: controller.signal,
    })
      .then((chapter) => setResult({ key: requestKey, status: 'ready', chapter }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, status: 'error', chapter: [] })
      })

    return () => controller.abort()
  }, [promise, requestKey, versionId])

  const chapter = result.key === requestKey ? result.chapter : []
  const status = result.key === requestKey ? result.status : 'loading'
  const verses = getPromiseVerses(chapter, promise)

  return {
    promise,
    status,
    verses,
    text: getPromiseText(chapter, promise),
  }
}
