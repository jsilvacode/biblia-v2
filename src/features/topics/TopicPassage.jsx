import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { getVersion } from '../bible/catalog'
import { useI18n } from '../../i18n'
import { useSettings } from '../settings/SettingsProvider'
import { getThematicReferencePath, formatThematicReference, resolveThematicReference } from './topicReference'
import { loadThematicPassage } from './topicPassage'
import styles from './TopicsPage.module.css'

function PassageText({ verses, reference }) {
  return (
    <div className={styles.passageText}>
      {verses.map((verse) => (
        <p key={`${verse.chapter}-${verse.verse}`}>
          <sup>{reference.chapterStart !== reference.chapterEnd ? `${verse.chapter}:` : ''}{verse.verse}</sup>
          {verse.text.replace(/^¶\s*/u, '')}
        </p>
      ))}
    </div>
  )
}

function PassageLink({ label, returnLabel, returnSource, returnTo, labelText }) {
  const path = getThematicReferencePath(label)
  if (!path) return null
  return (
    <Link
      className={styles.openPassage}
      state={{ attentionVerse: true, returnLabel, returnSource, returnTo }}
      to={path}
    >
      <Icon name="bookOpen" size={15} />
      <span>{labelText}</span>
    </Link>
  )
}

export function TopicPassage({ label, title, kind, returnSource, returnTo }) {
  const { locale, t } = useI18n()
  const location = useLocation()
  const { settings } = useSettings()
  const requestKey = `${label}:${settings.bibleVersion}`
  const [state, setState] = useState({ key: null, status: 'loading', passage: null, error: null })
  const resolved = resolveThematicReference(label)
  const version = getVersion(settings.bibleVersion)
  const localizedReference = formatThematicReference(resolved, locale)
  const returnPath = returnTo ?? `${location.pathname}${location.search}`

  useEffect(() => {
    const controller = new AbortController()
    loadThematicPassage(label, { versionId: settings.bibleVersion, signal: controller.signal })
      .then((passage) => setState({ key: requestKey, status: 'ready', passage, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ key: requestKey, status: 'error', passage: null, error })
      })
    return () => controller.abort()
  }, [label, requestKey, settings.bibleVersion])

  const isLoading = state.key !== requestKey || state.status === 'loading'

  return (
    <section className={`${styles.passage} ${kind === 'central' ? styles.centralPassage : ''}`}>
      <div className={styles.passageHeading}>
        <h4>{localizedReference || label}</h4>
        <PassageLink
          label={label}
          labelText={t('topics.openReader')}
          returnLabel={title}
          returnSource={returnSource ?? (returnPath.startsWith('/studies/') ? 'study' : 'topics')}
          returnTo={returnPath}
        />
      </div>
      {isLoading && (
      <p aria-live="polite" className={styles.passageStatus} role="status">{t('topics.passageLoading')}</p>
      )}
      {!isLoading && state.status === 'error' && (
        <div aria-live="polite" className={styles.passageError} role="alert">
          <Icon name="info" size={17} />
          <span>{t('topics.passageError')}</span>
        </div>
      )}
      {!isLoading && state.status === 'ready' && state.passage.verses.length > 0 && (
        <PassageText reference={state.passage.reference} verses={state.passage.verses} />
      )}
      {!isLoading && state.status === 'ready' && state.passage.verses.length === 0 && (
        <p className={styles.passageStatus}>{t('topics.passageEmpty')}</p>
      )}
      <span className={styles.passageVersion}>{version?.short ?? settings.bibleVersion}</span>
    </section>
  )
}
