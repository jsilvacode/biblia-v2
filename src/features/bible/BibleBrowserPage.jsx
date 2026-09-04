import { useEffect, useMemo, useRef, useState } from 'react'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { bibleBooks } from './catalog'
import { BookChapterAccordion } from './BookChapterAccordion'

export default function BibleBrowserPage() {
  const { locale, t } = useI18n()
  const [testament, setTestament] = useState('NT')
  const [selectedBookId, setSelectedBookId] = useState(null)
  const accordionRef = useRef(null)
  const books = useMemo(
    () => bibleBooks.filter((book) => book.testament === testament),
    [testament],
  )

  useEffect(() => {
    if (!selectedBookId || typeof window === 'undefined') return undefined
    if (window.matchMedia?.('(min-width: 600px)').matches) return undefined

    const picker = accordionRef.current?.querySelector(`[role="region"][id$="-chapters-${selectedBookId}"]`)
    if (!picker) return undefined

    const frame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      picker.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' })
      picker.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedBookId])

  function selectTestament(nextTestament) {
    setTestament(nextTestament)
    setSelectedBookId(null)
  }

  return (
    <div className="page bible-page">
      <PageIntro title={t('bible.title')}>
        {t('bible.subtitle')}
      </PageIntro>

      <div aria-label={t('nav.bible')} className="segmented-control" role="group">
        <button aria-pressed={testament === 'OT'} className={testament === 'OT' ? 'is-selected' : ''} onClick={() => selectTestament('OT')} type="button">
          {t('bible.oldTestament')}
        </button>
        <button aria-pressed={testament === 'NT'} className={testament === 'NT' ? 'is-selected' : ''} onClick={() => selectTestament('NT')} type="button">
          {t('bible.newTestament')}
        </button>
      </div>

      <div className="bible-library-list">
        <div aria-label={t('nav.bible')} ref={accordionRef}>
          <BookChapterAccordion
            books={books}
            initialOpenBookId={selectedBookId}
            locale={locale}
            onOpenBook={setSelectedBookId}
            openBookId={selectedBookId}
            prefix="bible"
            t={t}
          />
        </div>
      </div>
    </div>
  )
}
