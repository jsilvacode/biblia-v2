import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { loadThematicPassage } from './topicPassage'
import styles from './PassagePreview.module.css'

export default function PassagePreviewBody({ reference, versionId }) {
  const { t } = useI18n()
  const [result, setResult] = useState({ status: 'loading', passage: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadThematicPassage(reference, { versionId, signal: controller.signal })
      .then((passage) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', passage })
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== 'AbortError') setResult({ status: 'error', passage: null })
      })
    return () => controller.abort()
  }, [attempt, reference, versionId])

  if (result.status === 'loading') return <p role="status">{t('topics.passageLoading')}</p>
  if (result.status === 'error') return (
    <div className={styles.error} role="alert">
      <p>{t('topics.passageError')}</p>
      <button className="button button--compact" onClick={() => {
        setResult({ status: 'loading', passage: null })
        setAttempt((value) => value + 1)
      }} type="button">{t('topics.passageRetry')}</button>
    </div>
  )
  if (!result.passage.verses.length) return <p>{t('topics.passageEmpty')}</p>
  const multiChapter = result.passage.reference.chapterStart !== result.passage.reference.chapterEnd
  return (
    <div className={styles.verses} data-testid="passage-preview-text">
      {result.passage.verses.map((verse) => (
        <p key={`${verse.chapter}:${verse.verse}`}>
          <sup>{multiChapter ? `${verse.chapter}:` : ''}{verse.verse}</sup>
          {verse.text.replace(/^¶\s*/u, '')}
        </p>
      ))}
    </div>
  )
}
