import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { normalizeText } from '../bible/catalog'
import { MAX_PICKER_HEIGHT, positionPickerMenu, revealPickerOption } from '../home/pickerPosition'
import pickerStyles from '../home/HomePassagePicker.module.css'
import styles from './TopicGuide.module.css'

export function SituationSelector({ situations, selected, onSelect }) {
  const { t } = useI18n()
  const id = useId()
  const [activeIndex, setActiveIndex] = useState(null)
  const anchorRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const typeahead = useRef({ text: '', at: 0 })
  const revealActive = useRef(true)
  const isOpen = activeIndex !== null
  const groups = [...new Set(situations.map((situation) => situation.categoryId))]

  function close() { setActiveIndex(null) }
  function open() {
    revealActive.current = true
    typeahead.current = { text: '', at: 0 }
    setActiveIndex(Math.max(0, situations.indexOf(selected)))
  }
  function choose(index) {
    if (!situations[index]) return
    onSelect(situations[index])
    close()
    triggerRef.current?.focus({ preventScroll: true })
  }

  useLayoutEffect(() => {
    if (!isOpen) return
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
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('scroll', reposition, { passive: true })
    window.addEventListener('resize', reposition, { passive: true })
    window.visualViewport?.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('scroll', reposition)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', reposition)
      window.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('scroll', reposition)
    }
  }, [isOpen])

  function handleKeyDown(event) {
    const { key } = event
    revealActive.current = true
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(key)) {
      event.preventDefault()
      if (!isOpen && (key === 'ArrowDown' || key === 'ArrowUp')) {
        const selectedIndex = situations.indexOf(selected)
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : key === 'ArrowDown' ? 0 : situations.length - 1)
        return
      }
      const current = activeIndex ?? Math.max(0, situations.indexOf(selected))
      const next = key === 'Home' ? 0 : key === 'End' ? situations.length - 1
        : current + (key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : key === 'PageDown' ? 6 : -6)
      setActiveIndex(Math.max(0, Math.min(situations.length - 1, next)))
    } else if (key === 'Enter' || (key === ' ' && !typeahead.current.text)) {
      event.preventDefault()
      if (isOpen) choose(activeIndex)
      else open()
    } else if (key === 'Escape') {
      event.preventDefault()
      close()
    } else if (key === 'Tab') close()
    else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const now = event.timeStamp
      const text = (now - typeahead.current.at < 700 ? typeahead.current.text : '') + key
      typeahead.current = { text, at: now }
      const index = situations.findIndex((situation) => normalizeText(situation.title).startsWith(normalizeText(text)))
      if (index >= 0) setActiveIndex(index)
    }
  }

  return (
    <div className={styles.selectorBar}>
      <Icon name="bookOpen" size={20} />
      <span className="sr-only" id={`${id}-label`}>{t('topics.situationLabel')}</span>
      <div className={`${pickerStyles.control} ${styles.selectControl}`} ref={anchorRef}>
        <button
          aria-activedescendant={isOpen ? `${id}-option-${activeIndex}` : undefined}
          aria-controls={`${id}-list`}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={`${id}-label`}
          className={`${pickerStyles.trigger} ${styles.selectTrigger}`}
          onBlur={() => close()}
          onClick={() => isOpen ? close() : open()}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => { if (event.key === ' ') event.preventDefault() }}
          ref={triggerRef}
          role="combobox"
          type="button"
        >
          <span className={pickerStyles.value}>{selected?.title ?? t('topics.selectSituation')}</span>
          <span aria-hidden="true" className={pickerStyles.arrow}><Icon name="chevronDown" size={16} /></span>
        </button>
        {isOpen && (
          <div
            aria-labelledby={`${id}-label`}
            className={pickerStyles.menu}
            data-height-limit={MAX_PICKER_HEIGHT}
            id={`${id}-list`}
            onPointerDown={(event) => { event.preventDefault(); revealActive.current = false }}
            onWheel={() => { revealActive.current = false }}
            ref={menuRef}
            role="listbox"
          >
            {groups.map((group) => (
              <div aria-labelledby={`${id}-${group}`} key={group} role="group">
                <span className={pickerStyles.groupLabel} id={`${id}-${group}`}>{situations.find((situation) => situation.categoryId === group).categoryTitle}</span>
                {situations.map((situation, index) => situation.categoryId === group && (
                  <div
                    aria-selected={situation === selected}
                    className={`${pickerStyles.option}${index === activeIndex ? ` ${pickerStyles.activeOption}` : ''}`}
                    data-picker-index={index}
                    id={`${id}-option-${index}`}
                    key={situation.id}
                    onClick={() => choose(index)}
                    onPointerMove={(event) => {
                      if (event.pointerType !== 'touch') { revealActive.current = false; setActiveIndex(index) }
                    }}
                    role="option"
                  >{situation.title}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
