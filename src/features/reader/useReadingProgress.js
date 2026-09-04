import { useEffect, useMemo, useRef, useState } from 'react'

function getVerseNumbers(chapterData) {
  return chapterData.map((item) => item.verse).filter(Number.isFinite)
}

export function getReadingProgress(chapterData, verse) {
  const verses = getVerseNumbers(chapterData)
  if (!verses.length) return 0
  const foundIndex = verses.findIndex((candidate) => candidate >= verse)
  const index = foundIndex === -1 ? verses.length - 1 : foundIndex
  return Math.round(((index + 1) / verses.length) * 100)
}

function nextVisibleVerse(nodes, headerOffset = 96) {
  const candidate = nodes.find((node) => node.getBoundingClientRect().bottom > headerOffset)
  return Number(candidate?.dataset.verseNumber) || null
}

/**
 * Tracks the first meaningful verse in view. The observer only writes when the
 * active verse changes, rather than on every scroll event.
 */
export function useReadingProgress({ chapterData, chapterKey, enabled, initialVerse, onProgress }) {
  const [observed, setObserved] = useState(null)
  const observedRef = useRef(null)
  const onProgressRef = useRef(onProgress)

  useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])
  const fallbackVerse = initialVerse ?? chapterData[0]?.verse ?? null
  const activeVerse = observed?.chapterKey === chapterKey ? observed.verse : fallbackVerse
  const progress = useMemo(() => getReadingProgress(chapterData, activeVerse), [activeVerse, chapterData])

  useEffect(() => {
    if (!enabled || !chapterData.length || typeof IntersectionObserver !== 'function') return undefined
    const nodes = [...document.querySelectorAll('[data-verse-number]')]
    let frame = 0

    const update = () => {
      frame = 0
      const verse = nextVisibleVerse(nodes)
      if (!verse || verse === observedRef.current?.verse && observedRef.current?.chapterKey === chapterKey) return
      observedRef.current = { chapterKey, verse }
      setObserved({ chapterKey, verse })
    }

    const observer = new IntersectionObserver(() => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }, { rootMargin: '-96px 0px -48% 0px', threshold: 0 })
    nodes.forEach((node) => observer.observe(node))
    frame = window.requestAnimationFrame(update)

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [chapterData, chapterKey, enabled])

  useEffect(() => {
    if (!enabled || !activeVerse) return
    onProgressRef.current?.({ verse: activeVerse, progress })
  }, [activeVerse, enabled, progress])

  return { activeVerse, progress }
}
