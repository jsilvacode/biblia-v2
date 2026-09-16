import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import library from './data/topics.es.json'
import { TopicPassage } from './TopicPassage.jsx'
import { filterTopicSituations, getTopicSituations } from './topicSearch'
import styles from './TopicsExplorer.module.css'

const INITIAL_VISIBLE_SITUATIONS = 12

function TopicSituation({ initialOpen, location, situation, t }) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [hasOpened, setHasOpened] = useState(initialOpen)
  const sectionId = `topic-${situation.categoryId}-${situation.id}`
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
        <span className={styles.situationCopy}>
          <small className={styles.situationMeta}>{situation.categoryTitle}</small>
          <span aria-level="3" className={styles.situationTitle} role="heading">{situation.title}</span>
          <small className={styles.situationReference}>{t('topics.centralReading')}: {situation.central}</small>
        </span>
        <span aria-hidden="true" className={styles.situationChevron}>
          <Icon name="chevronRight" size={18} />
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

function CategoryButton({ category, isSelected, onSelect, t }) {
  return (
    <button aria-pressed={isSelected} className={styles.areaOption} onClick={() => onSelect(category.id)} type="button">
      <span className={styles.areaNumber}>{String(category.number).padStart(2, '0')}</span>
      <span>{category.title}</span>
      <small>{t('topics.situationCount', { count: category.situations.length })}</small>
    </button>
  )
}

export default function TopicsPage() {
  const { locale, t } = useI18n()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const selectedCategoryId = searchParams.get('category')
  const [visibleLimit, setVisibleLimit] = useState({ key: null, value: INITIAL_VISIBLE_SITUATIONS })
  const [areasOpen, setAreasOpen] = useState(false)
  const allSituations = useMemo(() => getTopicSituations(library), [])
  const selectedCategory = library.categories.find((category) => category.id === selectedCategoryId) ?? null

  const results = useMemo(() => filterTopicSituations(allSituations, {
    categoryId: selectedCategory?.id,
    query,
  }), [allSituations, query, selectedCategory?.id])
  const filterKey = `${query}\u0000${selectedCategory?.id ?? ''}`
  const currentVisibleLimit = visibleLimit.key === filterKey ? visibleLimit.value : INITIAL_VISIBLE_SITUATIONS
  const visibleSituations = results.slice(0, currentVisibleLimit)

  useEffect(() => {
    if (!location.hash || !results.length) return undefined
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
  }, [location.hash, results.length])

  function updateQuery(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  function selectCategory(categoryId) {
    const next = new URLSearchParams(searchParams)
    if (categoryId) next.set('category', categoryId)
    else next.delete('category')
    setSearchParams(next)
    setAreasOpen(false)
    window.requestAnimationFrame(() => document.getElementById('topic-results')?.focus({ preventScroll: false }))
  }

  return (
    <div className={`page ${styles.topicsPage}`}>
      <PageIntro eyebrow={t('topics.eyebrow')} title={t('topics.title')}>
        {t('topics.subtitle')}
      </PageIntro>
      {locale !== 'es' && <p className={styles.contentLanguage}>{t('topics.contentLanguage')}</p>}

      <label className={styles.searchField}>
        <span className="sr-only">{t('topics.searchLabel')}</span>
        <Icon name="search" size={20} />
        <input
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={t('topics.searchPlaceholder')}
          type="search"
          value={query}
        />
      </label>

      <div className={styles.explorer}>
        <aside aria-label={t('topics.areasLabel')} className={styles.desktopFilters}>
          <h2 className={styles.filterHeading}>{t('topics.areasLabel')}</h2>
          <button aria-pressed={!selectedCategory} className={styles.filterButton} onClick={() => selectCategory(null)} type="button">
            {t('topics.allAreas')}
          </button>
          {library.categories.map((category) => (
            <CategoryButton category={category} isSelected={category.id === selectedCategory?.id} key={category.id} onSelect={selectCategory} t={t} />
          ))}
        </aside>

        <div>
          <div className={styles.mobileFilters}>
            <div aria-label={t('topics.areasLabel')} className={styles.filterRow}>
              <button aria-pressed={!selectedCategory} className={styles.filterButton} onClick={() => selectCategory(null)} type="button">
                {t('topics.allAreas')}
              </button>
              {selectedCategory && (
                <button aria-pressed="true" className={styles.filterButton} onClick={() => setAreasOpen(true)} type="button">
                  {selectedCategory.title}
                </button>
              )}
              <button aria-expanded={areasOpen} aria-controls="topic-areas" className={styles.areasToggle} onClick={() => setAreasOpen((open) => !open)} type="button">
                {t('topics.viewAreas')} <Icon name="chevronDown" size={16} />
              </button>
            </div>
            {areasOpen && (
              <section aria-label={t('topics.areasLabel')} className={styles.areasPanel} id="topic-areas">
                <h2>{t('topics.chooseArea')}</h2>
                <div className={styles.areasList}>
                  {library.categories.map((category) => (
                    <CategoryButton category={category} isSelected={category.id === selectedCategory?.id} key={category.id} onSelect={selectCategory} t={t} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <section aria-live="polite" className={styles.results} id="topic-results" tabIndex={-1}>
            <header className={styles.resultsHeading}>
              <div>
                <h2>{selectedCategory ? selectedCategory.title : t('topics.allSituations')}</h2>
                <p>{query ? t('topics.searchResultsFor', { query }) : t('topics.resultsSupport')}</p>
              </div>
              <span className={styles.resultsCount}>{t('topics.showingCount', { shown: visibleSituations.length, count: results.length, total: library.totalSituations })}</span>
            </header>

            {results.length ? (
              <>
                <div className={styles.situationGrid}>
                  {visibleSituations.map((situation) => {
                    const sectionId = `topic-${situation.categoryId}-${situation.id}`
                    return (
                      <TopicSituation
                        initialOpen={location.hash === `#${sectionId}`}
                        key={`${sectionId}-${location.hash === `#${sectionId}` ? 'open' : 'closed'}`}
                        location={location}
                        situation={situation}
                        t={t}
                      />
                    )
                  })}
                </div>
                {visibleSituations.length < results.length && (
                  <div className={styles.moreRow}>
                    <button className={styles.moreButton} onClick={() => setVisibleLimit({ key: filterKey, value: currentVisibleLimit + INITIAL_VISIBLE_SITUATIONS })} type="button">
                      {t('topics.showMore')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <Icon name="search" size={24} />
                <p>{t('topics.noResults')}</p>
                {(query || selectedCategory) && <button className={styles.emptyAction} onClick={() => setSearchParams({})} type="button">{t('topics.clearFilters')}</button>}
              </div>
            )}
          </section>
        </div>
      </div>

      <aside className={styles.contextNote}>
        <Icon name="bookOpen" size={20} />
        <p>{t('topics.contextNote')}</p>
      </aside>
    </div>
  )
}
