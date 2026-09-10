import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { useReadingState } from '../reading/ReadingProvider'
import { BibleNavigator } from './BibleNavigator'

export default function BibleBrowserPage() {
  const { t } = useI18n()
  const { lastRead } = useReadingState()
  const hasHistory = Boolean(lastRead.updatedAt)

  return (
    <div className="page bible-page">
      <PageIntro title={t('bible.title')}>
        {t('bible.subtitle')}
      </PageIntro>

      <div className="bible-library-list bible-library-navigator">
        <BibleNavigator
          currentBookId={hasHistory ? lastRead.book : null}
          currentChapter={hasHistory ? lastRead.chapter : null}
          initialTestament={hasHistory && lastRead.book <= 39 ? 'OT' : 'NT'}
          startWithBooks
        />
      </div>
    </div>
  )
}
