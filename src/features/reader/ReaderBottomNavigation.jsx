import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { primaryNavigation } from '../../components/layout/primaryNavigation'
import { useI18n } from '../../i18n'

export function ReaderBottomNavigation({ bibleIsOpen = false, onOpenBible }) {
  const { t } = useI18n()

  return (
    <nav aria-label={t('app.name')} className="reader-bottom-navigation" data-reader-chrome>
      {primaryNavigation.map(({ id, to, icon, labelKey }) => {
        const content = <><Icon name={icon} size={20} /><span>{t(labelKey)}</span></>
        return id === 'bible' ? (
          <button aria-current="page" aria-expanded={bibleIsOpen} aria-haspopup="dialog" aria-label={t(labelKey)} className="reader-bottom-navigation__link reader-bottom-navigation__link--active" key={id} onClick={onOpenBible} type="button">
            {content}
          </button>
        ) : (
          <Link className="reader-bottom-navigation__link" key={id} to={to}>
            {content}
          </Link>
        )
      })}
    </nav>
  )
}
