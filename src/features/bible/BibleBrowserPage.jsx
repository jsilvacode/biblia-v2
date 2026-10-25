import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { useReadingState } from '../reading/ReadingProvider'
import { BibleNavigator } from './BibleNavigator'
import styles from './BibleBrowserPage.module.css'

export default function BibleBrowserPage() {
  const { t } = useI18n()
  const { lastRead } = useReadingState()
  const hasHistory = Boolean(lastRead.updatedAt)

  return (
    <div className={`page bible-page ${styles.library}`}>
      <PageIntro illustration={{ src: '/assets/editorial/bible-library-v1.webp', width: 1536, height: 1024 }} title={t('bible.title')}>
        {t('bible.subtitle')}
      </PageIntro>

      <div className="bible-library-list">
        <BibleNavigator
          currentBookId={hasHistory ? lastRead.book : null}
          currentChapter={hasHistory ? lastRead.chapter : null}
        />
      </div>
    </div>
  )
}
