import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { formatReference } from './catalog'
import { getReaderPath } from './readerPath'
import { useReadingState } from '../reading/ReadingProvider'
import { BibleNavigator } from './BibleNavigator'
import styles from './BibleBrowserPage.module.css'

export default function BibleBrowserPage() {
  const { locale, t } = useI18n()
  const { lastRead } = useReadingState()
  const hasHistory = Boolean(lastRead.updatedAt)
  const startingReading = { book: 1, chapter: 1 }
  const reading = hasHistory ? lastRead : startingReading

  return (
    <div className={`page bible-page ${styles.library}`}>
      <PageIntro illustration={{ src: '/assets/editorial/bible-library-v1.webp', width: 1536, height: 1024 }} title={t('bible.title')}>
        {t('bible.subtitle')}
      </PageIntro>

      <section aria-label={t('home.readingMoment')} className={styles.readingEntry}>
        <div>
          <p>{hasHistory ? t('home.lastReading') : t('home.startReading')}</p>
          <h2>{formatReference(reading, locale)}</h2>
          <span>{hasHistory ? t('home.continueHint') : t('home.startReadingDescription')}</span>
        </div>
        <Link className="button" to={getReaderPath(reading)}>
          {hasHistory ? t('home.continueReading') : t('home.startReading')}
          <Icon name="arrowRight" size={18} />
        </Link>
      </section>

      <div className="bible-library-list">
        <BibleNavigator
          currentBookId={hasHistory ? lastRead.book : null}
          currentChapter={hasHistory ? lastRead.chapter : null}
        />
      </div>
    </div>
  )
}
