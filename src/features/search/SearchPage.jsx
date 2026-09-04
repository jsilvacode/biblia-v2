import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageIntro } from '../../components/ui/PageIntro'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { formatReference } from '../bible/catalog'
import { parseReference } from '../bible/reference'
import { useSettings } from '../settings/SettingsProvider'

export default function SearchPage() {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const submittedQuery = searchParams.get('q') ?? ''
  const reference = parseReference(submittedQuery)
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)
  const [searchState, setSearchState] = useState({ key: null, status: 'idle', results: [] })
  const searchKey = `${settings.bibleVersion}:${submittedQuery}`
  const isSearching = Boolean(submittedQuery && !reference && searchState.key !== searchKey)

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/searchWorker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event) => {
      if (event.data.id !== requestIdRef.current) return
      setSearchState({
        key: event.data.key,
        message: event.data.message,
        results: event.data.results,
        status: event.data.status,
      })
    }
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    if (!submittedQuery || reference || !workerRef.current) return undefined

    const id = requestIdRef.current + 1
    requestIdRef.current = id
    workerRef.current.postMessage({ id, key: searchKey, query: submittedQuery, translationId: settings.bibleVersion })
  }, [reference, searchKey, settings.bibleVersion, submittedQuery])

  function submit(event) {
    event.preventDefault()
    const nextQuery = query.trim()
    setSearchParams(nextQuery ? { q: nextQuery } : {})
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
          onChange={(event) => setQuery(event.target.value)}
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
      ) : submittedQuery && searchState.results.length ? (
        <div className="search-results">
          <p className="result-count">{t('search.results', { count: searchState.results.length })}</p>
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
        </div>
      ) : submittedQuery ? (
        <div className="empty-state">
          <Icon name="search" size={24} />
          <p>{t('search.noResults')}</p>
        </div>
      ) : null}
    </div>
  )
}
