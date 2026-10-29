import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import library from './data/topics.es.json'
import { PassagePreviewProvider, PassageReferences } from './PassagePreview'
import { SituationSelector } from './SituationSelector'
import { filterTopicSituations, getTopicSituations } from './topicSearch'
import { findTopicSituationByLegacyHash } from './topicRoutes'
import styles from './TopicGuide.module.css'

const situations = getTopicSituations(library)

function TopicsGuide() {
  const { categoryId, situationId } = useParams()
  const { locale, t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const legacy = findTopicSituationByLegacyHash(library, location.hash)
  const requestedCategory = searchParams.get('category') ?? categoryId ?? legacy?.categoryId
  const requestedSituation = searchParams.get('situation') ?? situationId ?? legacy?.id
  const selected = requestedSituation
    ? situations.find((situation) => situation.id === requestedSituation && (!requestedCategory || situation.categoryId === requestedCategory))
    : requestedCategory || searchParams.has('q')
      ? filterTopicSituations(situations, { categoryId: requestedCategory, query: searchParams.get('q') })[0]
      : null

  function selectSituation(situation) {
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    next.delete('reading')
    next.set('category', situation.categoryId)
    next.set('situation', situation.id)
    navigate({ pathname: '/topics', search: `?${next.toString()}`, hash: '' })
  }

  if (requestedSituation && !selected) return (
    <div className={`page ${styles.guide}`}>
      <section className={styles.missing}>
        <h1>{t('topics.topicUnavailable')}</h1>
        <p>{t('topics.topicUnavailableSupport')}</p>
        <Link to="/topics">{t('topics.goToGuide')}</Link>
      </section>
    </div>
  )

  return (
    <div className={`page ${styles.guide}`}>
      <PageIntro eyebrow={t('topics.eyebrow')} illustration={{ src: '/assets/editorial/guidance-v2.webp', width: 1536, height: 1024 }} title={t('topics.title')} />
      {locale !== 'es' && <p className={styles.contentLanguage}>{t('topics.contentLanguage')}</p>}
      <SituationSelector onSelect={selectSituation} selected={selected} situations={situations} />
      {selected && (
        <section aria-labelledby="topic-readings-title" className={styles.readings} data-testid="topic-readings">
          <header>
            <p>{selected.categoryTitle}</p>
            <h2 id="topic-readings-title">{selected.title}</h2>
          </header>
          <PassageReferences
            primaryReference={selected.central}
            references={[selected.central, ...selected.companions]}
            title={selected.title}
          />
        </section>
      )}
    </div>
  )
}

export default function TopicsPage() {
  return <PassagePreviewProvider><TopicsGuide /></PassagePreviewProvider>
}
