import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { PageIntro } from '../../components/ui/PageIntro'
import { normalizeText } from '../bible/catalog'
import { useI18n } from '../../i18n'
import library from './data/topics.es.json'
import { TopicPassage } from './TopicPassage.jsx'
import styles from './TopicsPage.module.css'

function TopicSituation({ categoryId, initialOpen, location, situation, t }) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [hasOpened, setHasOpened] = useState(initialOpen)
  const sectionId = `topic-${categoryId}-${situation.id}`
  const readingCount = 1 + situation.companions.length
  const returnTo = `${location.pathname}${location.search}#${sectionId}`

  function handleToggle(event) {
    const nextOpen = event.currentTarget.open
    setIsOpen(nextOpen)
    if (!nextOpen) return
    setHasOpened(true)
    if (window.location.hash !== `#${sectionId}`) {
      window.history.replaceState(window.history.state, '', returnTo)
    }
  }

  return (
    <details className={styles.situationCard} id={sectionId} onToggle={handleToggle} open={isOpen}>
      <summary className={styles.situationSummary}>
        <span className={styles.situationTitle}>
          <span aria-level="3" className={styles.situationHeading} role="heading">{situation.title}</span>
          <small>{t('topics.readingCount', { count: readingCount })}</small>
        </span>
        <span aria-hidden="true" className={styles.situationChevron}>
          <Icon name="chevronDown" size={18} />
        </span>
      </summary>
      {hasOpened ? (
        <div className={styles.passageStream}>
          <TopicPassage kind="central" label={situation.central} returnTo={returnTo} title={situation.title} />
          {situation.companions.map((reference, index) => (
            <TopicPassage key={`${reference}-${index}`} kind="companion" label={reference} returnTo={returnTo} title={situation.title} />
          ))}
        </div>
      ) : null}
    </details>
  )
}

export default function TopicsPage() {
  const { t } = useI18n()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const selectedCategoryId = searchParams.get('category')
  const normalizedQuery = normalizeText(query)

  const visibleCategories = useMemo(() => {
    if (normalizedQuery) {
      return library.categories
        .map((category) => ({
          ...category,
          situations: category.situations.filter((situation) => normalizeText([
            category.title,
            situation.title,
            situation.central,
            ...situation.companions,
          ].join(' ')).includes(normalizedQuery)),
        }))
        .filter((category) => category.situations.length > 0)
    }

    if (selectedCategoryId) {
      return library.categories.filter((category) => category.id === selectedCategoryId)
    }

    return []
  }, [normalizedQuery, selectedCategoryId])

  const resultCount = visibleCategories.reduce((total, category) => total + category.situations.length, 0)
  const showingIndex = !normalizedQuery && !selectedCategoryId

  useEffect(() => {
    if (!location.hash) return undefined
    const targetId = decodeURIComponent(location.hash.slice(1))
    let delayedFrame
    const frame = window.requestAnimationFrame(() => {
      delayedFrame = window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: 'start' })
      })
    })
    const timeout = window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ block: 'start' }), 220)
    return () => {
      window.cancelAnimationFrame(frame)
      if (delayedFrame) window.cancelAnimationFrame(delayedFrame)
      window.clearTimeout(timeout)
    }
  }, [location.hash, selectedCategoryId])

  function updateQuery(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  function selectCategory(categoryId) {
    setSearchParams({ category: categoryId })
    window.requestAnimationFrame(() => document.getElementById('topic-results')?.focus({ preventScroll: false }))
  }

  return (
    <div className={`page ${styles.topicsPage}`}>
      <PageIntro eyebrow={t('topics.eyebrow')} title={t('topics.title')}>
        {t('topics.subtitle')}
      </PageIntro>

      <label className={styles.searchField}>
        <span className="sr-only">{t('topics.searchLabel')}</span>
        <Icon name="search" size={19} />
        <input
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={t('topics.searchPlaceholder')}
          type="search"
          value={query}
        />
      </label>

      {showingIndex ? (
        <section aria-labelledby="topic-index-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="eyebrow">{t('topics.indexEyebrow')}</p>
              <h2 id="topic-index-title">{t('topics.chooseArea')}</h2>
            </div>
            <span>{t('topics.situationCount', { count: library.totalSituations })}</span>
          </div>
          <div className={styles.categoryGrid}>
            {library.categories.map((category) => (
              <button className={styles.categoryCard} key={category.id} onClick={() => selectCategory(category.id)} type="button">
                <span className={styles.categoryNumber}>{String(category.number).padStart(2, '0')}</span>
                <span>
                  <strong>{category.title}</strong>
                  <small>{t('topics.readingCount', { count: category.situations.length })}</small>
                </span>
                <Icon name="chevronRight" size={18} />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section aria-live="polite" className={styles.results} id="topic-results" tabIndex={-1}>
          <div className={styles.resultsHeading}>
            {selectedCategoryId && !normalizedQuery ? (
              <button className={styles.backButton} onClick={() => setSearchParams({})} type="button">
                <Icon name="arrowLeft" size={17} /> {t('topics.allAreas')}
              </button>
            ) : <span />}
            <span>{t('topics.resultCount', { count: resultCount })}</span>
          </div>

          {visibleCategories.length ? visibleCategories.map((category) => (
            <div className={styles.categorySection} key={category.id}>
              <div className={styles.categoryTitle}>
                <span>{String(category.number).padStart(2, '0')}</span>
                <h2>{category.title}</h2>
              </div>
              <div className={styles.situationGrid}>
                {category.situations.map((situation) => {
                  const sectionId = `topic-${category.id}-${situation.id}`
                  const initialOpen = location.hash === `#${sectionId}`
                  return (
                    <TopicSituation
                      categoryId={category.id}
                      initialOpen={initialOpen}
                      key={`${category.id}-${situation.id}-${initialOpen ? 'open' : 'closed'}`}
                      location={location}
                      situation={situation}
                      t={t}
                    />
                  )
                })}
              </div>
            </div>
          )) : (
            <div className={styles.emptyState}>
              <Icon name="search" size={24} />
              <p>{t('topics.noResults')}</p>
            </div>
          )}
        </section>
      )}

      <aside className={styles.contextNote}>
        <Icon name="bookOpen" size={20} />
        <p>{t('topics.contextNote')}</p>
      </aside>
    </div>
  )
}
