import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import {
  formatReference,
  getAdjacentReference,
  getBook,
  getLocalizedBookName,
  getVersion,
} from '../bible/catalog'
import { loadChapter } from '../bible/bibleRepository'
import { useReading } from '../reading/ReadingProvider'
import { useSaved } from '../saved/SavedProvider'
import { SettingsPopover } from '../settings/SettingsPopover'
import { useSettings } from '../settings/SettingsProvider'
import { CommentarySheet } from './CommentarySheet'
import { QuickNavigationSheet } from './QuickNavigationSheet'
import { ReaderBottomNavigation } from './ReaderBottomNavigation'
import { ReaderSectionMenu } from './ReaderSectionMenu'
import { createVerseShareData, createVerseShareUrl, shareVerse } from './shareVerse'
import { VerseActionsSheet } from './VerseActionsSheet'
import { useReaderImmersion } from './useReaderImmersion'
import { useReadingProgress } from './useReadingProgress'

const readerDesktopLinks = [
  ['home', '/', 'home'],
  ['bible', '/bible', 'book'],
  ['search', '/search', 'search'],
  ['saved', '/saved', 'bookmark'],
]

function getValidHeading(value) {
  const heading = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!heading || /^[,.:;)}\]]/u.test(heading)) return null
  return heading
}

function getChapterSubtitle(chapterData) {
  return chapterData.map((item) => getValidHeading(item.heading)).find(Boolean) ?? null
}

export default function ReaderPage() {
  const { book: rawBook, chapter: rawChapter, verse: rawVerse } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { locale, t } = useI18n()
  const { settings, updateSetting } = useSettings()
  const { setLastRead } = useReading()
  const { isBookmarked, isHighlighted, toggleBookmark, toggleHighlight } = useSaved()
  const [chapterResult, setChapterResult] = useState({ key: null, status: 'loading', data: [] })
  const [activeDialog, setActiveDialog] = useState(null)
  const [actionFeedback, setActionFeedback] = useState('')
  const [attentionVerseKey, setAttentionVerseKey] = useState(null)
  const [selectedVerseOverride, setSelectedVerseOverride] = useState(null)
  const dialogTriggerRef = useRef(null)
  const dialogReturnFocusRef = useRef(null)
  const synchronizedSharedVersionRef = useRef(null)
  const reference = useMemo(() => ({
    book: Number(rawBook),
    chapter: Number(rawChapter),
    verse: rawVerse ? Number(rawVerse) : null,
  }), [rawBook, rawChapter, rawVerse])
  const book = getBook(reference.book)
  const sharedVersionId = new URLSearchParams(location.search).get('v')
  const sharedVersion = sharedVersionId && getVersion(sharedVersionId).id === sharedVersionId
    ? getVersion(sharedVersionId)
    : null
  const version = sharedVersion ?? getVersion(settings.bibleVersion)
  const requestKey = `${version.id}:${reference.book}:${reference.chapter}`
  const routeKey = `${reference.book}:${reference.chapter}:${rawVerse ?? ''}`
  const requestedReturnTo = typeof location.state?.returnTo === 'string' ? location.state.returnTo : null
  const returnTo = requestedReturnTo && (
    requestedReturnTo.startsWith('/topics')
    || requestedReturnTo.startsWith('/studies/la-fe-de-jesus')
  ) ? requestedReturnTo : null
  const returnLabel = returnTo && typeof location.state?.returnLabel === 'string'
    ? location.state.returnLabel
    : null
  const returnSource = returnTo && location.state?.returnSource === 'study' ? 'study' : 'topics'
  const attentionKey = location.state?.attentionVerse && rawVerse
    ? `${location.key}:${requestKey}:${rawVerse}`
    : null
  const selectedVerse = selectedVerseOverride?.routeKey === routeKey
    ? selectedVerseOverride.verse
    : (rawVerse ? Number(rawVerse) : null)
  const status = chapterResult.key === requestKey ? chapterResult.status : 'loading'
  const chapterData = chapterResult.key === requestKey ? chapterResult.data : []
  const selectedItem = chapterData.find((item) => item.verse === selectedVerse) ?? null
  const chapterSubtitle = getChapterSubtitle(chapterData)
  const chapterSubtitleVerse = chapterData.find((item) => getValidHeading(item.heading) === chapterSubtitle)?.verse
  const { progress } = useReadingProgress({
    chapterData,
    chapterKey: requestKey,
    enabled: status === 'ready',
    initialVerse: reference.verse,
    onProgress: ({ verse, progress: nextProgress }) => setLastRead({
      book: reference.book,
      chapter: reference.chapter,
      verse,
      progress: nextProgress,
    }),
  })
  const {
    isImmersive,
    onPointerDown,
    onPointerUp,
    revealChrome,
  } = useReaderImmersion({ chapterKey: requestKey, enabled: status === 'ready', isOverlayOpen: Boolean(activeDialog) })

  useEffect(() => {
    if (!sharedVersion) {
      synchronizedSharedVersionRef.current = null
      return
    }

    if (settings.bibleVersion === sharedVersion.id) {
      synchronizedSharedVersionRef.current = sharedVersion.id
      return
    }

    if (synchronizedSharedVersionRef.current !== sharedVersion.id) {
      updateSetting('bibleVersion', sharedVersion.id)
      return
    }

    if (settings.bibleVersion !== sharedVersion.id) {
      const search = new URLSearchParams(location.search)
      search.set('v', settings.bibleVersion)
      navigate(
        { pathname: location.pathname, search: search.toString() },
        { replace: true, state: location.state },
      )
    }
  }, [location.pathname, location.search, location.state, navigate, settings.bibleVersion, sharedVersion, updateSetting])

  useEffect(() => {
    if (!book || reference.chapter < 1 || reference.chapter > book.chapters) return undefined
    const controller = new AbortController()
    loadChapter({ versionId: version.id, bookId: reference.book, chapter: reference.chapter, signal: controller.signal })
      .then((data) => {
        setChapterResult({ key: requestKey, status: 'ready', data })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setChapterResult({ key: requestKey, status: 'error', data: [] })
      })
    return () => controller.abort()
  }, [book, reference, requestKey, version.id])

  useEffect(() => {
    if (status !== 'ready' || !rawVerse) return undefined
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(`verse-${rawVerse}`)
      if (!target) return
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [rawVerse, requestKey, status])

  useEffect(() => {
    if (!attentionKey || status !== 'ready') return undefined

    const activationFrame = window.requestAnimationFrame(() => {
      setAttentionVerseKey(attentionKey)
    })
    const timeout = window.setTimeout(() => {
      setAttentionVerseKey((current) => current === attentionKey ? null : current)
    }, 2700)

    return () => {
      window.cancelAnimationFrame(activationFrame)
      window.clearTimeout(timeout)
    }
  }, [attentionKey, status])

  useEffect(() => {
    if (!actionFeedback) return undefined
    const timeout = window.setTimeout(() => setActionFeedback(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [actionFeedback])

  if (!book || reference.chapter < 1 || reference.chapter > book.chapters) return <Navigate replace to="/bible" />

  const selectedReference = {
    book: reference.book,
    chapter: reference.chapter,
    verse: selectedVerse ?? 1,
    version: version.id,
  }
  const selectedReferenceLabel = formatReference(selectedReference, locale)
  const previous = getAdjacentReference(reference, 'previous')
  const next = getAdjacentReference(reference, 'next')

  function closeDialog() {
    setActiveDialog(null)
    setSelectedVerseOverride(null)
    revealChrome(true)
  }

  function openDialog(name, event) {
    dialogTriggerRef.current = event.currentTarget
    dialogReturnFocusRef.current = event.detail === 0 ? event.currentTarget : null
    revealChrome(false)
    setActiveDialog(name)
  }

  function openVerseActions(event, verse) {
    dialogTriggerRef.current = event.currentTarget
    dialogReturnFocusRef.current = event.detail === 0 ? event.currentTarget : null
    revealChrome(false)
    setSelectedVerseOverride({ routeKey, verse })
    setActiveDialog('actions')
  }

  function handleBack() {
    const appHistoryIndex = window.history.state?.idx
    if (returnTo) navigate(returnTo, { replace: true })
    else if (typeof appHistoryIndex === 'number' && appHistoryIndex > 0) navigate(-1)
    else navigate('/bible', { replace: true })
  }

  function move(direction) {
    const adjacent = direction === 'next' ? next : previous
    if (adjacent) {
      closeDialog()
      navigate(`/read/${adjacent.book}/${adjacent.chapter}`, {
        state: returnTo ? { returnLabel, returnSource, returnTo } : undefined,
      })
    }
  }

  function goToChapter(bookId, chapter) {
    closeDialog()
    navigate(`/read/${bookId}/${chapter}`, {
      state: returnTo ? { returnLabel, returnSource, returnTo } : undefined,
    })
  }

  async function handleToggleBookmark() {
    const willSave = !isBookmarked(selectedReference)
    await toggleBookmark(selectedReference)
    setActionFeedback(t(willSave ? 'reader.bookmarkAdded' : 'reader.bookmarkRemoved'))
  }

  async function handleToggleHighlight() {
    const willHighlight = !isHighlighted(selectedReference)
    await toggleHighlight(selectedReference)
    setActionFeedback(t(willHighlight ? 'reader.highlightAdded' : 'reader.highlightRemoved'))
  }

  async function handleShare() {
    const data = createVerseShareData({
      reference: selectedReferenceLabel,
      text: selectedItem?.text ?? '',
      url: createVerseShareUrl({
        book: reference.book,
        chapter: reference.chapter,
        locale,
        origin: window.location.origin,
        verse: selectedReference.verse,
        versionId: version.id,
      }),
      version: version.short,
    })
    const result = await shareVerse(data)
    if (result === 'shared') setActionFeedback(t('reader.shared'))
    if (result === 'copied') setActionFeedback(t('reader.copied'))
    if (result === 'unavailable') setActionFeedback(t('reader.shareUnavailable'))
    return result
  }

  function openCommentary() {
    setActiveDialog('commentary')
  }

  return (
    <div className={`reader-page reader-page--${settings.fontFamily} reader-page--${settings.readerLineHeight}${isImmersive ? ' reader-page--immersive' : ''}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <header className="reader-header" data-reader-chrome>
        <div className="reader-header__inner">
          <button aria-label={t('common.back')} className="icon-button reader-header__back" onClick={handleBack} type="button"><Icon name="arrowLeft" size={20} strokeWidth={1.65} /></button>
          <button
            aria-expanded={activeDialog === 'navigation'}
            aria-haspopup="dialog"
            className="reader-header__reference"
            onClick={(event) => openDialog('navigation', event)}
            type="button"
          >
            <span>{getLocalizedBookName(book, locale)} {reference.chapter}</span><Icon name="chevronDown" size={18} strokeWidth={1.65} />
          </button>
          <nav aria-label={t('app.name')} className="reader-header__desktop-navigation">
            {readerDesktopLinks.map(([label, path, icon]) => (
              <Link aria-label={t(`nav.${label}`)} className="icon-button reader-header__navigation-link" key={path} to={path}>
                <Icon name={icon} size={20} strokeWidth={1.65} />
              </Link>
            ))}
          </nav>
          <button
            aria-expanded={activeDialog === 'sections'}
            aria-haspopup="dialog"
            aria-label={t('reader.openReaderMenu')}
            className="icon-button reader-header__menu"
            onClick={(event) => openDialog('sections', event)}
            type="button"
          >
            <Icon name="menu" size={20} strokeWidth={1.65} />
          </button>
        </div>
      </header>

      <div aria-hidden="true" className="reading-progress" data-reader-chrome><span style={{ width: `${progress}%` }} /></div>
      {returnTo && (
        <div className="reader-return-context">
          <button onClick={handleBack} type="button">
            <Icon name="arrowLeft" size={17} />
            <span>{t(returnSource === 'study' ? 'reader.backToStudy' : 'reader.backToTopics')}</span>
          </button>
        </div>
      )}
      <article className="reader-content" aria-busy={status === 'loading'}>
        <h1>{getLocalizedBookName(book, locale)} {reference.chapter}</h1>
        {chapterSubtitle && <p className="reader-chapter-subtitle">{chapterSubtitle}</p>}
        {status === 'loading' && <div className="reader-skeleton"><i /><i /><i /><i /><i /></div>}
        {status === 'error' && <div className="reader-error"><p>{t('reader.loadError')}</p><Link to="/bible">{t('common.back')}</Link></div>}
        {status === 'ready' && chapterData.map((item) => {
          const isActionSelection = activeDialog === 'actions' && selectedVerse === item.verse
          const isAttentionPulsing = attentionVerseKey === attentionKey && item.verse === Number(rawVerse)
          const isVerseHighlighted = isHighlighted({ book: reference.book, chapter: reference.chapter, verse: item.verse, version: version.id })
          const heading = getValidHeading(item.heading)
          return (
            <section className="verse-block" key={item.verse}>
              {heading && item.verse !== chapterSubtitleVerse && <h2>{heading}</h2>}
              <button
                aria-pressed={isActionSelection}
                className={`verse${isActionSelection ? ' is-selected' : ''}${isAttentionPulsing ? ' is-attention-pulsing' : ''}${isVerseHighlighted ? ' is-highlighted' : ''}`}
                data-verse-number={item.verse}
                id={`verse-${item.verse}`}
                onClick={(event) => openVerseActions(event, item.verse)}
                type="button"
              >
                <sup>{item.verse}</sup><span>{item.text}</span>
              </button>
            </section>
          )
        })}
      </article>

      {actionFeedback && <p aria-live="polite" className="reader-action-feedback" role="status">{actionFeedback}</p>}

      <nav className="chapter-pager" aria-label={t('reader.quickNavigation')}>
        <button disabled={!previous} onClick={() => move('previous')} type="button"><Icon name="arrowLeft" size={18} /> {t('common.previous')}</button>
        <button disabled={!next} onClick={() => move('next')} type="button">{t('common.next')} <Icon name="arrowRight" size={18} /></button>
      </nav>
      <ReaderBottomNavigation
        bibleIsOpen={activeDialog === 'navigation'}
        onOpenBible={(event) => openDialog('navigation', event)}
      />

      {activeDialog === 'actions' && selectedItem && (
        <VerseActionsSheet
          isBookmarked={isBookmarked(selectedReference)}
          isHighlighted={isHighlighted(selectedReference)}
          isOpen
          onClose={closeDialog}
          onOpenCommentary={openCommentary}
          onShare={handleShare}
          onToggleBookmark={handleToggleBookmark}
          onToggleHighlight={handleToggleHighlight}
          reference={selectedReferenceLabel}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
      {activeDialog === 'commentary' && selectedItem && (
        <CommentarySheet
          bookId={reference.book}
          chapter={reference.chapter}
          isOpen
          onClose={closeDialog}
          reference={selectedReferenceLabel}
          returnFocusRef={dialogReturnFocusRef}
          verse={selectedReference.verse}
        />
      )}
      {activeDialog === 'settings' && (
        <SettingsPopover
          anchorRef={dialogTriggerRef}
          isOpen
          onClose={closeDialog}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
      {activeDialog === 'navigation' && (
        <QuickNavigationSheet
          book={book}
          chapter={reference.chapter}
          isOpen
          key={requestKey}
          onClose={closeDialog}
          onGoToChapter={goToChapter}
          anchorRef={dialogTriggerRef}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
      {activeDialog === 'sections' && (
        <ReaderSectionMenu
          anchorRef={dialogTriggerRef}
          isOpen
          onClose={closeDialog}
          onOpenSettings={() => setActiveDialog('settings')}
          returnFocusRef={dialogReturnFocusRef}
        />
      )}
    </div>
  )
}
