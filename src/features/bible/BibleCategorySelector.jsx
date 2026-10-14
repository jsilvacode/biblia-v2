import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { MAX_PICKER_HEIGHT, positionPickerMenu, revealPickerOption } from '../home/pickerPosition'
import pickerStyles from '../home/HomePassagePicker.module.css'
import { normalizeText } from './catalog'
import styles from './BibleCategorySelector.module.css'

export function BibleCategorySelector({ categories, selected, onSelect }) {
  const { t } = useI18n()
  const id = useId()
  const anchorRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const typeahead = useRef({ text: '', at: 0 })
  const revealActive = useRef(true)
  const [activeIndex, setActiveIndex] = useState(null)
  const isOpen = activeIndex !== null
  const selectedIndex = Math.max(0, categories.indexOf(selected))

  function open() {
    revealActive.current = true
    typeahead.current = { text: '', at: 0 }
    setActiveIndex(selectedIndex)
  }

  function choose(index) {
    if (!categories[index]) return
    onSelect(categories[index])
    setActiveIndex(null)
    triggerRef.current?.focus({ preventScroll: true })
  }

  useLayoutEffect(() => {
    if (!isOpen) return undefined
    if (!positionPickerMenu(menuRef.current, anchorRef.current)) {
      const frame = requestAnimationFrame(() => setActiveIndex(null))
      return () => cancelAnimationFrame(frame)
    }
    if (revealActive.current) revealPickerOption(menuRef.current, activeIndex)
  }, [activeIndex, isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    const reposition = () => {
      if (!positionPickerMenu(menuRef.current, anchorRef.current)) setActiveIndex(null)
    }
    const dismiss = (event) => {
      if (!anchorRef.current?.contains(event.target)) setActiveIndex(null)
    }
    const viewport = window.visualViewport
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('scroll', reposition, { passive: true })
    window.addEventListener('resize', reposition, { passive: true })
    viewport?.addEventListener('resize', reposition)
    viewport?.addEventListener('scroll', reposition)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', reposition)
      window.removeEventListener('resize', reposition)
      viewport?.removeEventListener('resize', reposition)
      viewport?.removeEventListener('scroll', reposition)
    }
  }, [isOpen])

  function handleKeyDown(event) {
    const { key } = event
    revealActive.current = true
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(key)) {
      event.preventDefault()
      typeahead.current = { text: '', at: 0 }
      if (!isOpen && ['ArrowDown', 'ArrowUp'].includes(key)) { open(); return }
      const next = key === 'Home' ? 0 : key === 'End' ? categories.length - 1
        : (activeIndex ?? selectedIndex) + (key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : key === 'PageDown' ? 6 : -6)
      setActiveIndex(Math.max(0, Math.min(categories.length - 1, next)))
    } else if (key === 'Enter' || (key === ' ' && (!typeahead.current.text || event.timeStamp - typeahead.current.at > 700))) {
      event.preventDefault()
      if (isOpen) choose(activeIndex)
      else open()
    } else if (key === 'Escape' || key === 'Tab') {
      if (key === 'Escape') event.preventDefault()
      setActiveIndex(null)
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const text = (event.timeStamp - typeahead.current.at < 700 ? typeahead.current.text : '') + key
      typeahead.current = { text, at: event.timeStamp }
      const index = categories.findIndex((category) => normalizeText(t(category.labelKey)).startsWith(normalizeText(text)))
      if (index >= 0) setActiveIndex(index)
    }
  }

  return (
    <div className={`${pickerStyles.control} ${styles.selector}`} ref={anchorRef}>
      <span className="sr-only" id={`${id}-label`}>{t('bible.categoriesLabel')}</span>
      <button
        aria-activedescendant={isOpen ? `${id}-option-${activeIndex}` : undefined}
        aria-controls={`${id}-list`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        className={`${pickerStyles.trigger} ${styles.trigger}`}
        onBlur={() => setActiveIndex(null)}
        onClick={() => isOpen ? setActiveIndex(null) : open()}
        onKeyDown={handleKeyDown}
        onKeyUp={(event) => { if (event.key === ' ') event.preventDefault() }}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <Icon name={selected.icon} size={20} />
        <span className={styles.value}>{t(selected.labelKey)}</span>
        <small aria-hidden="true">{selected.books.length}</small>
        <Icon name="chevronDown" size={16} />
      </button>
      {isOpen && (
        <div
          aria-labelledby={`${id}-label`}
          className={`${pickerStyles.menu} ${styles.menu}`}
          data-height-limit={MAX_PICKER_HEIGHT}
          id={`${id}-list`}
          onPointerDown={(event) => { event.preventDefault(); revealActive.current = false }}
          onWheel={() => { revealActive.current = false }}
          ref={menuRef}
          role="listbox"
        >
          {categories.map((category, index) => (
            <div
              aria-selected={category.id === selected.id}
              className={`${pickerStyles.option} ${styles.option}${index === activeIndex ? ` ${pickerStyles.activeOption}` : ''}`}
              data-category-id={category.id}
              data-picker-index={index}
              id={`${id}-option-${index}`}
              key={category.id}
              onClick={() => choose(index)}
              onPointerMove={(event) => {
                if (event.pointerType !== 'touch') { revealActive.current = false; setActiveIndex(index) }
              }}
              role="option"
            >
              <Icon name={category.icon} size={18} />
              <span>{t(category.labelKey)}</span>
              <small>{category.books.length}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
