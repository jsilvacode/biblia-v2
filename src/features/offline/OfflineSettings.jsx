import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { getVersion } from '../bible/catalog'
import {
  getOfflineStatus,
  prepareBibleOffline,
  prepareCommentaryOffline,
  requestPersistentStorage,
} from './offlineLibrary'

function percentage(progress) {
  if (!progress.total) return 0
  return Math.round((progress.completed / progress.total) * 100)
}

export function OfflineSettings({ translationId }) {
  const { t } = useI18n()
  const [status, setStatus] = useState(null)
  const [activeDownload, setActiveDownload] = useState(null)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [error, setError] = useState(false)
  const version = getVersion(translationId)

  async function refreshStatus() {
    const nextStatus = await getOfflineStatus(translationId)
    setStatus(nextStatus)
  }

  useEffect(() => {
    let cancelled = false
    getOfflineStatus(translationId).then((nextStatus) => {
      if (!cancelled) setStatus(nextStatus)
    })

    return () => {
      cancelled = true
    }
  }, [translationId])

  async function prepare(kind) {
    setActiveDownload(kind)
    setError(false)
    setProgress({ completed: 0, total: 0 })
    try {
      await requestPersistentStorage()
      if (kind === 'bible') {
        await prepareBibleOffline(translationId, setProgress)
      } else {
        await prepareCommentaryOffline(setProgress)
      }
      await refreshStatus()
    } catch {
      setError(true)
    } finally {
      setActiveDownload(null)
    }
  }

  const bibleReady = status?.bible.cached === status?.bible.total
  const commentaryReady = status?.commentary.cached === status?.commentary.total
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
        <button className="button button--compact" disabled={isDownloading || bibleReady} onClick={() => prepare('bible')} type="button">
          {activeDownload === 'bible' ? `${percentage(progress)}%` : (bibleReady ? t('settings.ready') : t('settings.prepare'))}
        </button>
      </div>
      <div className="offline-row">
        <div>
          <strong>{t('reader.commentary')}</strong>
          <small>{commentaryReady ? t('settings.readyOffline') : t('settings.commentaryOffline')}</small>
        </div>
        <button className="button button--compact" disabled={isDownloading || commentaryReady} onClick={() => prepare('commentary')} type="button">
          {activeDownload === 'commentary' ? `${percentage(progress)}%` : (commentaryReady ? t('settings.ready') : t('settings.prepare'))}
        </button>
      </div>
      {error && <p className="offline-error">{t('settings.offlineError')}</p>}
    </section>
  )
}
