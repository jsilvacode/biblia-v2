import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import styles from './HomeDailyVideo.module.css'

const DailyVideoSection = lazy(() => import('../daily-video/DailyVideoSection').then((module) => ({ default: module.DailyVideoSection })))

function VideoPlaceholder({ loading = false }) {
  const { t } = useI18n()
  return (
    <section aria-busy={loading || undefined} aria-label={t('dailyVideo.title')} className={styles.placeholder}>
      <h2>{t('dailyVideo.title')}</h2>
      {loading && <span className="sr-only">{t('dailyVideo.loading')}</span>}
    </section>
  )
}

export function HomeDailyVideo() {
  const { t } = useI18n()
  const containerRef = useRef(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver !== 'function')

  useEffect(() => {
    if (visible) return undefined
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      setVisible(true)
      observer.disconnect()
    }, { rootMargin: '128px 0px', threshold: 0 })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div className={styles.container} ref={containerRef}>
      <a className={`sr-only ${styles.directLink}`} href="/este-dia-con-dios">{t('dailyVideo.viewToday')}</a>
      {visible ? <Suspense fallback={<VideoPlaceholder loading />}><DailyVideoSection featured /></Suspense> : <VideoPlaceholder />}
    </div>
  )
}
