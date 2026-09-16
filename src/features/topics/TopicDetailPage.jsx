import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import library from './data/topics.es.json'
import { TopicPassage } from './TopicPassage.jsx'
import { useReaderImmersion } from '../reader/useReaderImmersion'
import {
  createCompanionId,
  createTopicsIndexPath,
  findTopicSituation,
  resolveTopicCompanion,
} from './topicRoutes'
import styles from './TopicDetailPage.module.css'

function CompanionSelector({ companions, location, searchParams, selectedIndex, situation, t }) {
  return (
    <section aria-labelledby="topic-companions" className={styles.companions}>
      <div className={styles.sectionHeading}>
        <p className="eyebrow">{t('topics.companionEyebrow')}</p>
        <h2 id="topic-companions">{t('topics.companionReadings')}</h2>
        <p>{t('topics.companionSupport')}</p>
      </div>
      <div aria-label={t('topics.companionReadings')} className={styles.companionChoices}>
        {companions.map((reference, index) => {
          const next = new URLSearchParams(searchParams)
          next.set('reading', createCompanionId(index))
          return (
            <Link
              aria-current={index === selectedIndex ? 'true' : undefined}
              className={styles.companionChoice}
              key={`${reference}-${index}`}
              to={{ pathname: location.pathname, search: `?${next.toString()}` }}
            >
              {reference}
            </Link>
          )
        })}
      </div>
      {selectedIndex !== null && (
        <div className={styles.companionPassage}>
          <TopicPassage
            kind="companion"
            label={companions[selectedIndex]}
            returnTo={`${location.pathname}${location.search}`}
            title={situation.title}
          />
        </div>
      )}
    </section>
  )
}

function MissingTopic({ indexPath, t }) {
  return (
    <div className={`page ${styles.topicDetailPage}`}>
      <Link className={styles.backLink} to={indexPath}>
        <Icon name="arrowLeft" size={17} />
        <span>{t('topics.backToGuide')}</span>
      </Link>
      <section className={styles.missingTopic}>
        <Icon name="bookOpen" size={24} />
        <h1>{t('topics.topicUnavailable')}</h1>
        <p>{t('topics.topicUnavailableSupport')}</p>
        <Link className={styles.guideLink} to={indexPath}>{t('topics.goToGuide')}</Link>
      </section>
    </div>
  )
}

export default function TopicDetailPage() {
  const { categoryId, situationId } = useParams()
  const { locale, t } = useI18n()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const situation = useMemo(() => findTopicSituation(library, { categoryId, situationId }), [categoryId, situationId])
  const indexPath = createTopicsIndexPath(searchParams)
  const reading = searchParams.get('reading')
  const companion = resolveTopicCompanion(reading, situation?.companions ?? [])
  const readingKey = situation ? `${categoryId}:${situationId}:${reading ?? 'central'}` : null
  const {
    isImmersive,
    onPointerDown,
    onPointerUp,
  } = useReaderImmersion({ chapterKey: readingKey, enabled: Boolean(situation), isOverlayOpen: false })

  useEffect(() => {
    const root = document.documentElement
    if (isImmersive) root.dataset.topicImmersive = 'true'
    else delete root.dataset.topicImmersive
    return () => delete root.dataset.topicImmersive
  }, [isImmersive])

  useEffect(() => {
    if (!reading || companion.isValid) return
    const next = new URLSearchParams(searchParams)
    next.delete('reading')
    setSearchParams(next, { replace: true })
  }, [companion.isValid, reading, searchParams, setSearchParams])

  if (!situation) return <MissingTopic indexPath={indexPath} t={t} />

  return (
    <div className={`page ${styles.topicDetailPage}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <Link className={styles.backLink} to={indexPath}>
        <Icon name="arrowLeft" size={17} />
        <span>{t('topics.backToGuide')}</span>
      </Link>

      <PageIntro eyebrow={situation.categoryTitle} title={situation.title}>
        {locale !== 'es' ? t('topics.contentLanguage') : t('topics.detailSupport')}
      </PageIntro>

      <section aria-labelledby="topic-central-reading" className={styles.centralReading}>
        <div className={styles.sectionHeading}>
          <p className="eyebrow">{t('topics.centralEyebrow')}</p>
          <h2 id="topic-central-reading">{t('topics.centralReading')}</h2>
        </div>
        <TopicPassage
          kind="central"
          label={situation.central}
          returnTo={`${location.pathname}${location.search}`}
          title={situation.title}
        />
      </section>

      <CompanionSelector
        companions={situation.companions}
        location={location}
        searchParams={searchParams}
        selectedIndex={companion.index}
        situation={situation}
        t={t}
      />
    </div>
  )
}
