import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'

const links = [
  ['home', '/', 'home'],
  ['search', '/search', 'search'],
  ['saved', '/saved', 'bookmark'],
]

export function ReaderBottomNavigation({ bibleIsOpen = false, onOpenBible }) {
  const { t } = useI18n()

  return (
    <nav aria-label={t('app.name')} className="reader-bottom-navigation" data-reader-chrome>
      <Link className="reader-bottom-navigation__link" to="/">
        <Icon name="home" size={20} />
        <span>{t('nav.home')}</span>
      </Link>
      <button aria-expanded={bibleIsOpen} aria-haspopup="dialog" aria-label={t('nav.bible')} className="reader-bottom-navigation__link reader-bottom-navigation__link--active" onClick={onOpenBible} type="button">
        <Icon name="book" size={20} />
        <span>{t('nav.bible')}</span>
      </button>
      {links.slice(1).map(([label, path, icon]) => (
        <Link className="reader-bottom-navigation__link" key={path} to={path}>
          <Icon name={icon} size={20} />
          <span>{t(`nav.${label}`)}</span>
        </Link>
      ))}
    </nav>
  )
}
