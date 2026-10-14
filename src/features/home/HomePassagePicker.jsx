import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { bibleBooks, getBook, getLocalizedBookName, getVersion, normalizeText } from '../bible/catalog'
import { useSettings } from '../settings/SettingsProvider'
import { MAX_PICKER_HEIGHT, positionPickerMenu, revealPickerOption } from './pickerPosition'
import styles from './HomePassagePicker.module.css'

const TYPEAHEAD_TIMEOUT = 700
const labelFallbacks = {
  es: { selectBook: 'Seleccionar libro', openChapter: 'Abrir capítulo' },
  en: { selectBook: 'Select a book', openChapter: 'Open chapter' },
  'pt-BR': { selectBook: 'Selecionar livro', openChapter: 'Abrir capítulo' },
}

export function HomePassagePicker({ onGoToChapter, compact = false, bookTriggerRef, onOpenChange, leadingAction }) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const id = useId()
  const [selection, setSelection] = useState({ bookId: null, chapter: null })
  const [popup, setPopup] = useState(null)
  const popupRef = useRef(null)
  const triggersRef = useRef({ book: null, chapter: null })
  const menusRef = useRef({ book: null, chapter: null })
  const anchorsRef = useRef({ book: null, chapter: null })
  const keepActiveVisibleRef = useRef(true)
  const typeaheadRef = useRef({ text: '', at: 0 })
  const openChangeRef = useRef(onOpenChange)
  const selectedBook = getBook(selection.bookId)
  const version = getVersion(settings.bibleVersion)
  const ready = Boolean(selectedBook && Number.isInteger(selection.chapter)
    && selection.chapter >= 1 && selection.chapter <= selectedBook.chapters)
  const bookLabel = t('reader.book')
  const chapterLabel = t('common.chapter')
  const localLabel = (name) => {
    const key = `home.${name}`
    const value = t(key)
    return value === key ? (labelFallbacks[locale] ?? labelFallbacks.es)[name] : value
  }
  const selectBookLabel = localLabel('selectBook')
  const openChapterLabel = localLabel('openChapter')
  const optionLists = useMemo(() => ({
    book: bibleBooks.map((book) => ({
      value: book.id,
      label: getLocalizedBookName(book, locale),
      testament: book.testament,
    })),
    chapter: Array.from({ length: getBook(selection.bookId)?.chapters ?? 0 }, (_, index) => ({
      value: index + 1,
      label: String(index + 1),
    })),
  }), [locale, selection.bookId])

  useEffect(() => { openChangeRef.current = onOpenChange }, [onOpenChange])
  useEffect(() => () => {
    if (popupRef.current) openChangeRef.current?.(false)
  }, [])

  const closePicker = useCallback((restoreFocus = false) => {
    const name = popupRef.current?.name
    if (!name) return
    popupRef.current = null
    typeaheadRef.current = { text: '', at: 0 }
    setPopup(null)
    openChangeRef.current?.(false)
    if (restoreFocus) triggersRef.current[name]?.focus({ preventScroll: true })
  }, [])

  const positionPicker = useCallback((name) => {
    const list = menusRef.current[name]
    const trigger = triggersRef.current[name]
    const anchorElement = anchorsRef.current[name]
    if (!list || !trigger || !anchorElement || trigger.disabled) return false

    return positionPickerMenu(list, anchorElement)
  }, [])

  const revealActiveOption = useCallback((name, index) => {
    const list = menusRef.current[name]
    revealPickerOption(list, index)
  }, [])

  const updateActiveOption = (name, index) => {
    const boundedIndex = Math.max(0, Math.min(optionLists[name].length - 1, index))
    const next = { name, index: boundedIndex }
    const wasOpen = Boolean(popupRef.current)
    popupRef.current = next
    keepActiveVisibleRef.current = true
    setPopup(next)
    if (!wasOpen) openChangeRef.current?.(true)
  }

  const openPicker = (name, firstIndex = null) => {
    if (triggersRef.current[name]?.disabled || !optionLists[name].length) return
    const currentValue = name === 'book' ? selection.bookId : selection.chapter
    const selectedIndex = optionLists[name].findIndex((option) => option.value === currentValue)
    typeaheadRef.current = { text: '', at: 0 }
    updateActiveOption(name, firstIndex ?? Math.max(0, selectedIndex))
  }

  const chooseOption = (name, index) => {
    const option = optionLists[name][index]
    if (!option) return
    if (name === 'book') {
      if (option.value !== selection.bookId) setSelection({ bookId: option.value, chapter: null })
    } else {
      setSelection((current) => ({ ...current, chapter: option.value }))
    }
    closePicker(true)
  }

  useLayoutEffect(() => {
    if (!popup) return undefined
    if (!positionPicker(popup.name)) {
      const frame = requestAnimationFrame(() => closePicker())
      return () => cancelAnimationFrame(frame)
    }
    if (keepActiveVisibleRef.current) revealActiveOption(popup.name, popup.index)
    return undefined
  }, [popup, optionLists, closePicker, positionPicker, revealActiveOption])

  const openedName = popup?.name ?? null
  useEffect(() => {
    if (!openedName) return undefined
    function refreshPosition() {
      const current = popupRef.current
      if (!current) return
      if (!positionPicker(current.name)) closePicker()
      else if (keepActiveVisibleRef.current) revealActiveOption(current.name, current.index)
    }
    function handleOutsidePointer(event) {
      const name = popupRef.current?.name
      if (!name) return
      if (!triggersRef.current[name]?.contains(event.target) && !menusRef.current[name]?.contains(event.target)) {
        closePicker()
      }
    }
    const viewport = window.visualViewport
    document.addEventListener('pointerdown', handleOutsidePointer)
    window.addEventListener('resize', refreshPosition, { passive: true })
    window.addEventListener('scroll', refreshPosition, { passive: true })
    viewport?.addEventListener('resize', refreshPosition, { passive: true })
    viewport?.addEventListener('scroll', refreshPosition, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer)
      window.removeEventListener('resize', refreshPosition)
      window.removeEventListener('scroll', refreshPosition)
      viewport?.removeEventListener('resize', refreshPosition)
      viewport?.removeEventListener('scroll', refreshPosition)
    }
  }, [openedName, closePicker, positionPicker, revealActiveOption])

  function handleKeyDown(event, name) {
    const key = event.key
    const current = popupRef.current?.name === name ? popupRef.current : null
    const entries = optionLists[name]
    keepActiveVisibleRef.current = true
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(key)) {
      event.preventDefault()
      typeaheadRef.current = { text: '', at: 0 }
      if (key === 'Home' || key === 'End') updateActiveOption(name, key === 'Home' ? 0 : entries.length - 1)
      else if (key === 'PageDown' || key === 'PageUp') {
        updateActiveOption(name, (current?.index ?? 0) + (key === 'PageDown' ? 6 : -6))
      } else if (current) updateActiveOption(name, current.index + (key === 'ArrowDown' ? 1 : -1))
      else {
        const selected = name === 'book' ? selection.bookId : selection.chapter
        openPicker(name, !selected && key === 'ArrowUp' ? entries.length - 1 : null)
      }
    } else if (key === 'Enter' || (key === ' ' && (!current || name === 'chapter'
      || !typeaheadRef.current.text || event.timeStamp - typeaheadRef.current.at >= TYPEAHEAD_TIMEOUT))) {
      event.preventDefault()
      if (current) chooseOption(name, current.index)
      else openPicker(name)
    } else if (key === 'Escape' && current) {
      event.preventDefault()
      closePicker(true)
    } else if (key === 'Tab') closePicker()
    else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      if (!current) openPicker(name)
      const now = event.timeStamp
      const previous = typeaheadRef.current
      const text = (now - previous.at < TYPEAHEAD_TIMEOUT ? previous.text : '') + key
      typeaheadRef.current = { text, at: now }
      const query = normalizeText(text)
      if (name === 'chapter') {
        const exact = entries.findIndex((option) => option.label === query)
        const index = exact >= 0 ? exact : entries.findIndex((option) => option.label.startsWith(query))
        if (index >= 0) updateActiveOption(name, index)
      } else {
        const repeated = [...query].every((character) => character === query[0])
        const prefix = repeated ? query[0] : query
        const start = prefix?.length === 1 ? (popupRef.current?.index ?? 0) + 1 : 0
        for (let offset = 0; offset < entries.length; offset += 1) {
          const index = (start + offset) % entries.length
          if (normalizeText(entries[index].label).startsWith(prefix)) {
            updateActiveOption(name, index)
            break
          }
        }
      }
    }
  }

  function renderOption(name, option, index) {
    const isActive = popup?.name === name && popup.index === index
    const currentValue = name === 'book' ? selection.bookId : selection.chapter
    return (
      <div
        aria-selected={option.value === currentValue}
        className={`${styles.option}${isActive ? ` ${styles.activeOption}` : ''}`}
        data-picker-index={index}
        id={`${id}-${name}-${option.value}`}
        key={option.value}
        onClick={() => chooseOption(name, index)}
        onPointerMove={(event) => {
          if (event.pointerType !== 'touch' && !isActive) updateActiveOption(name, index)
        }}
        role="option"
      >
        {option.label}
      </div>
    )
  }

  function renderPicker(name, label, value, disabled = false) {
    const expanded = popup?.name === name
    const activeValue = expanded ? optionLists[name][popup.index]?.value : null
    const empty = name === 'book' ? !selectedBook : selection.chapter === null
    return (
      <div className={styles.field}>
        <span className="sr-only" id={`${id}-${name}-label`}>{label}</span>
        <div
          className={`${styles.control}${empty ? ` ${styles.emptyControl}` : ''}`}
          data-picker-field={name}
          ref={(node) => { anchorsRef.current[name] = node }}
        >
          <button
            aria-activedescendant={activeValue ? `${id}-${name}-${activeValue}` : undefined}
            aria-controls={`${id}-${name}-list`}
            aria-expanded={expanded}
            aria-haspopup="listbox"
            aria-labelledby={`${id}-${name}-label`}
            className={styles.trigger}
            data-picker-trigger={name}
            disabled={disabled}
            onBlur={(event) => {
              if (!menusRef.current[name]?.contains(event.relatedTarget)) closePicker()
            }}
            onClick={() => {
              triggersRef.current[name]?.focus({ preventScroll: true })
              if (popupRef.current?.name === name) closePicker()
              else openPicker(name)
            }}
            onKeyDown={(event) => handleKeyDown(event, name)}
            onKeyUp={(event) => {
              // Space belongs to the combobox/typeahead; the native button's
              // keyup click would toggle the list a second time.
              if (event.key === ' ') event.preventDefault()
            }}
            ref={(node) => {
              triggersRef.current[name] = node
              if (name === 'book' && bookTriggerRef) bookTriggerRef.current = node
            }}
            role="combobox"
            type="button"
          >
            <span className={styles.value}>{value}</span>
            <span aria-hidden="true" className={styles.arrow}><Icon name="chevronDown" size={16} /></span>
          </button>
          <div
            aria-labelledby={`${id}-${name}-label`}
            className={`${styles.menu}${name === 'chapter' ? ` ${styles.chapterMenu}` : ''}`}
            data-height-limit={MAX_PICKER_HEIGHT}
            data-picker-menu={name}
            hidden={!expanded}
            id={`${id}-${name}-list`}
            onPointerDown={(event) => {
              keepActiveVisibleRef.current = false
              event.preventDefault()
            }}
            onWheel={() => { keepActiveVisibleRef.current = false }}
            ref={(node) => { menusRef.current[name] = node }}
            role="listbox"
          >
            {name === 'book' ? ['OT', 'NT'].map((testament) => (
              <div aria-labelledby={`${id}-${testament}-label`} key={testament} role="group">
                <span className={styles.groupLabel} id={`${id}-${testament}-label`}>
                  {t(testament === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}
                </span>
                {optionLists.book.map((option, index) => option.testament === testament ? renderOption(name, option, index) : null)}
              </div>
            )) : optionLists.chapter.map((option, index) => renderOption(name, option, index))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      aria-label={`${t('home.chooseReading')} · ${version.short}`}
      className={`${styles.picker}${compact ? ` ${styles.compact}` : ''}${leadingAction ? ` ${styles.withLeadingAction}` : ''}`}
      data-testid={compact ? 'reader-passage-picker' : 'home-reading-actions'}
      onSubmit={(event) => {
        event.preventDefault()
        if (ready) {
          closePicker()
          onGoToChapter(selection.bookId, selection.chapter)
        }
      }}
    >
      {leadingAction}
      {renderPicker('book', bookLabel, selectedBook ? getLocalizedBookName(selectedBook, locale) : selectBookLabel)}
      {renderPicker('chapter', chapterLabel, selection.chapter ?? chapterLabel, !selectedBook)}
      <button aria-label={compact ? openChapterLabel : undefined} className={styles.openChapter} disabled={!ready} type="submit">
        <span>{openChapterLabel}</span>
        <Icon name="arrowRight" size={17} />
      </button>
      <span aria-live="polite" className={styles.status} role="status">
        {ready ? t('bible.openReference', { reference: `${getLocalizedBookName(selectedBook, locale)} ${selection.chapter}` })
          : selectedBook ? t('bible.chooseChapter') : ''}
      </span>
    </form>
  )
}
