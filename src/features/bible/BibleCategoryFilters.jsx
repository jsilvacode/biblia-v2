import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { BibleCategorySelector } from './BibleCategorySelector'
import styles from './BibleCategoryFilters.module.css'

export function BibleCategoryFilters({ categories, selected, onSelect }) {
  const { t } = useI18n()

  return (
    <div>
      <div className={styles.dropdown}>
        <BibleCategorySelector categories={categories} onSelect={onSelect} selected={selected} />
      </div>
      <div aria-label={t('bible.categoriesLabel')} className={styles.cards} role="group">
        <p className={styles.heading}>{t('bible.exploreCategories')}</p>
        <div className={styles.grid}>
          {categories.map((category) => (
            <button
              aria-label={`${t(category.labelKey)}, ${t(category.books.length === 1 ? 'bible.bookCountOne' : 'bible.bookCount', { count: category.books.length })}`}
              aria-pressed={category.id === selected.id}
              className={styles.card}
              data-category-id={category.id}
              key={category.id}
              onClick={() => onSelect(category)}
              type="button"
            >
              <span aria-hidden="true" className={styles.icon}><Icon name={category.icon} size={21} /></span>
              <span className={styles.label}>{t(category.labelKey)}</span>
              <span aria-hidden="true" className={styles.count}>{category.books.length}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
