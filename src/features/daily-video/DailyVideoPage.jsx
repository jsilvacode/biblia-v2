import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { DailyVideoSection } from './DailyVideoSection'
import styles from './DailyVideoSection.module.css'

export default function DailyVideoPage() {
  const { date } = useParams()
  const { t } = useI18n()

  return (
    <div className={`page ${styles.page}`}>
      <Link className={styles.backLink} to="/"><Icon name="arrowLeft" size={16} /> {t('dailyVideo.backHome')}</Link>
      <DailyVideoSection date={date} key={date} />
    </div>
  )
}
