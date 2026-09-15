import { Link, useSearchParams } from 'react-router-dom'
import { PageIntro } from '../../components/ui/PageIntro'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { formatReference } from '../bible/catalog'
import { parseReference } from '../bible/reference'
import { useSettings } from '../settings/SettingsProvider'
import { useBibleTextSearch } from './useBibleTextSearch'

export default function SearchPage() {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const activeQuery = query.trim()
  const reference = parseReference(activeQuery)
  const searchState = useBibleTextSearch({
    debounceMs: 180,
    enabled: Boolean(activeQuery && !reference),
    query: activeQuery,
    translationId: settings.bibleVersion,
  })
  const isSearching = searchState.status === 'loading'

  function submit(event) {
    event.preventDefault()
    const nextQuery = query.trim()
    setSearchParams(nextQuery ? { q: nextQuery } : {}, { replace: true })
  }

  function changeQuery(event) {
    const nextQuery = event.target.value
    setSearchParams(nextQuery.trim() ? { q: nextQuery } : {}, { replace: true })
  }

  return (
    <div className="page search-page">
      <PageIntro title={t('search.title')}>
        {t('search.subtitle')}
      </PageIntro>
      <form className="search-form" onSubmit={submit} role="search">
        <Icon name="search" size={21} />
        <input
          aria-label={t('search.title')}
          autoFocus
          onChange={changeQuery}
          type="search"
          value={query}
        />
        <button className="button" type="submit">{t('common.search')}</button>
      </form>
      <p className="search-hint">
        <span>{t('search.referenceHint')}</span>
        <em className="search-hint__examples">{t('search.referenceExamples')}</em>
      </p>

      {reference ? (
        <Link
          className="reference-result"
          state={{ attentionVerse: true }}
          to={`/read/${reference.book}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ''}`}
        >
          <span className="card-icon"><Icon name="book" size={19} /></span>
          <span>
            <strong>{formatReference(reference, locale)}</strong>
            <small>{t('search.openReference')}</small>
          </span>
          <Icon name="arrowRight" size={20} />
        </Link>
      ) : isSearching ? (
        <div className="empty-state"><Icon name="search" size={24} /><p>{t('search.loading')}</p></div>
      ) : searchState.status === 'error' ? (
        <div className="empty-state"><Icon name="search" size={24} /><p>{t('search.error')}</p></div>
      ) : activeQuery && searchState.results.length ? (
        <div className="search-results">
          <p aria-live="polite" className="result-count">
            {t('search.showingResults', { shown: searchState.results.length, total: searchState.total })}
          </p>
          {searchState.results.map((result) => (
            <Link
              className="reference-result search-result"
              key={`${result.book}:${result.chapter}:${result.verse}`}
              state={{ attentionVerse: true }}
              to={`/read/${result.book}/${result.chapter}/${result.verse}`}
            >
              <span className="card-icon"><Icon name="book" size={19} /></span>
              <span>
                <strong>{formatReference(result, locale)}</strong>
                <small>{result.text}</small>
              </span>
              <Icon name="arrowRight" size={20} />
            </Link>
          ))}
          {searchState.hasMore && (
            <button
              className="button button--compact search-results__more"
              disabled={searchState.isLoadingMore}
              onClick={searchState.loadMore}
              type="button"
            >
              {searchState.isLoadingMore ? t('search.loading') : t('search.showMore')}
            </button>
          )}
          {searchState.loadMoreError && <p className="search-results__error" role="alert">{t('search.error')}</p>}
        </div>
      ) : activeQuery ? (
        <div className="empty-state">
          <Icon name="search" size={24} />
          <p>{t('search.noResults')}</p>
        </div>
      ) : null}
    </div>
  )
}
