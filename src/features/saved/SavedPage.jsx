import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/ui/PageIntro'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { formatReference } from '../bible/catalog'
import { useSaved } from './SavedProvider'

// Notes are intentionally withheld until they have the same offline and
// editing guarantees as saved verses. A visible “coming soon” tab is a dead
// end, so the saved surface contains only actions that work today.
const tabs = ['bookmarks', 'highlights']

export default function SavedPage() {
  const { locale, t } = useI18n()
  const { bookmarks, highlights, isReady } = useSaved()
  const [activeTab, setActiveTab] = useState('bookmarks')

  function changeTab(tab) {
    setActiveTab(tab)
    window.requestAnimationFrame(() => document.getElementById(`saved-${tab}-tab`)?.focus())
  }

  function handleTabKeyDown(event, tab) {
    const index = tabs.indexOf(tab)
    let nextIndex = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    changeTab(tabs[nextIndex])
  }

  function renderReferences(items, icon, emptyMessage) {
    if (!isReady || !items.length) {
      return <div className="empty-state"><Icon name={icon} size={25} /><p>{emptyMessage}</p></div>
    }

    return (
      <div className="saved-list">
        {items.map((item) => (
          <Link
            className="saved-item"
            key={item.id}
            state={{ attentionVerse: true }}
            to={`/read/${item.book}/${item.chapter}/${item.verse}`}
          >
            <span className="card-icon"><Icon name={icon} size={18} /></span>
            <span><strong>{formatReference(item, locale)}</strong><small>{String(item.version).toUpperCase()}</small></span>
            <Icon name="arrowRight" size={18} />
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="page saved-page">
      <PageIntro title={t('saved.title')}>
        {t('saved.subtitle')}
      </PageIntro>
      <div className="saved-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-controls={`saved-${tab}-panel`}
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'is-selected' : ''}
            id={`saved-${tab}-tab`}
            key={tab}
            onClick={() => changeTab(tab)}
            onKeyDown={(event) => handleTabKeyDown(event, tab)}
            role="tab"
            tabIndex={activeTab === tab ? 0 : -1}
            type="button"
          >
            {t(`saved.${tab}`)}
          </button>
        ))}
      </div>
      <section aria-labelledby={`saved-${activeTab}-tab`} id={`saved-${activeTab}-panel`} role="tabpanel">
        {activeTab === 'bookmarks' && renderReferences(bookmarks, 'bookmark', t('saved.empty'))}
        {activeTab === 'highlights' && renderReferences(highlights, 'highlight', t('saved.emptyHighlights'))}
      </section>
    </div>
  )
}
