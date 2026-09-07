import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { getVersion } from '../bible/catalog'
import {
  getOfflineStatus,
  getOfflineDownloadState,
  prepareBibleOffline,
  prepareCommentaryOffline,
  requestPersistentStorage,
  subscribeOfflineDownload,
} from './offlineLibrary'

function percentage(progress) {
  if (!progress.total) return 0
  return Math.round((progress.completed / progress.total) * 100)
}

export function OfflineSettings({ translationId }) {
  const { t } = useI18n()
  const [status, setStatus] = useState(null)
  const [bibleDownload, setBibleDownload] = useState(() => getOfflineDownloadState('bible', translationId))
  const [commentaryDownload, setCommentaryDownload] = useState(() => getOfflineDownloadState('commentary', translationId))
  const [error, setError] = useState(false)
  const version = getVersion(translationId)

  const refreshStatus = useCallback(async () => {
    const nextStatus = await getOfflineStatus(translationId)
    setStatus(nextStatus)
  }, [translationId])

  useEffect(() => {
    let cancelled = false
    getOfflineStatus(translationId).then((nextStatus) => {
      if (!cancelled) setStatus(nextStatus)
    })

    return () => {
      cancelled = true
    }
  }, [refreshStatus, translationId])

  useEffect(() => {
    const handleBibleDownload = (nextState) => {
      setBibleDownload(nextState)
      if (nextState.status === 'error') setError(true)
      if (nextState.status === 'complete') refreshStatus()
    }
    const handleCommentaryDownload = (nextState) => {
      setCommentaryDownload(nextState)
      if (nextState.status === 'error') setError(true)
      if (nextState.status === 'complete') refreshStatus()
    }
    const unsubscribeBible = subscribeOfflineDownload('bible', translationId, handleBibleDownload)
    const unsubscribeCommentary = subscribeOfflineDownload('commentary', translationId, handleCommentaryDownload)
    return () => {
      unsubscribeBible()
      unsubscribeCommentary()
    }
  }, [refreshStatus, translationId])

  async function prepare(kind) {
    setError(false)
    try {
      await requestPersistentStorage()
      if (kind === 'bible') {
        await prepareBibleOffline(translationId)
      } else {
        await prepareCommentaryOffline()
      }
    } catch {
      setError(true)
    }
  }

  const bibleReady = status?.bible.cached === status?.bible.total
  const commentaryReady = status?.commentary.cached === status?.commentary.total
  const activeDownload = bibleDownload.status === 'running'
    ? 'bible'
    : (commentaryDownload.status === 'running' ? 'commentary' : null)
  const progress = activeDownload === 'bible' ? bibleDownload : commentaryDownload
  const isDownloading = activeDownload !== null

  return (
    <section className="settings-section settings-section--offline">
      <div className="offline-heading">
        <div>
          <h2>{t('settings.offline')}</h2>
          <p>{t('settings.offlineDescription')}</p>
        </div>
      </div>
      <div className="offline-row">
        <div>
          <strong>{version.short}</strong>
          <small>{bibleReady ? t('settings.readyOffline') : t('settings.bibleOffline')}</small>
        </div>
        <button className="button button--compact" disabled={!status || isDownloading || bibleReady} onClick={() => prepare('bible')} type="button">
          {activeDownload === 'bible' ? `${percentage(progress)}%` : (bibleReady ? t('settings.ready') : t('settings.prepare'))}
        </button>
      </div>
      <div className="offline-row">
        <div>
          <strong>{t('reader.commentary')}</strong>
          <small>{commentaryReady ? t('settings.readyOffline') : t('settings.commentaryOffline')}</small>
        </div>
        <button className="button button--compact" disabled={!status || isDownloading || commentaryReady} onClick={() => prepare('commentary')} type="button">
          {activeDownload === 'commentary' ? `${percentage(progress)}%` : (commentaryReady ? t('settings.ready') : t('settings.prepare'))}
        </button>
      </div>
      {error && <p className="offline-error">{t('settings.offlineError')}</p>}
    </section>
  )
}
