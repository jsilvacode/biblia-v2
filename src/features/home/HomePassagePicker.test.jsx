import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePassagePicker } from './HomePassagePicker'

vi.mock('../../i18n', () => ({
  useI18n: () => ({
    locale: 'es',
    t: (key, values = {}) => ({
      'reader.book': 'Libro',
      'common.chapter': 'Capítulo',
      'home.chooseReading': 'Elegir una lectura',
      'bible.oldTestament': 'Antiguo Testamento',
      'bible.newTestament': 'Nuevo Testamento',
      'bible.chooseChapter': 'Elige un capítulo',
      'bible.openReference': `Abrir ${values.reference}`,
    }[key] ?? key),
  }),
}))

vi.mock('../settings/SettingsProvider', () => ({
  useSettings: () => ({ settings: { bibleVersion: 'nbla' } }),
}))

function rectangle(top = 180, height = 49, width = 280) {
  return { x: 40, y: top, left: 40, top, right: 40 + width, bottom: top + height, width, height }
}

function chooseBook(name) {
  fireEvent.click(screen.getByRole('combobox', { name: 'Libro', exact: true }))
  fireEvent.click(screen.getByRole('option', { name, exact: true }))
}

function chooseChapter(chapter) {
  fireEvent.click(screen.getByRole('combobox', { name: 'Capítulo', exact: true }))
  fireEvent.click(screen.getByRole('option', { name: String(chapter), exact: true }))
}

describe('HomePassagePicker', () => {
  beforeEach(() => {
    // JSDOM has no layout; interaction tests need a visible anchor so the
    // viewport guard does not close an otherwise valid dropdown immediately.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return rectangle(180, this.getAttribute('role') === 'option' ? 36 : 49)
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('starts neutral and rejects a submission without a complete passage', () => {
    const onGoToChapter = vi.fn()
    render(<HomePassagePicker onGoToChapter={onGoToChapter} />)
    const book = screen.getByRole('combobox', { name: 'Libro', exact: true })
    const chapter = screen.getByRole('combobox', { name: 'Capítulo', exact: true })
    const open = screen.getByRole('button', { name: 'Abrir capítulo', exact: true })

    expect(book.textContent).toBe('Seleccionar libro')
    expect(chapter.textContent).toBe('—')
    expect(chapter.disabled).toBe(true)
    expect(open.disabled).toBe(true)
    expect(screen.queryByRole('listbox')).toBeNull()
    fireEvent.submit(screen.getByTestId('home-reading-actions'))
    expect(onGoToChapter).not.toHaveBeenCalled()
  })

  it('starts the compact reader neutral and requires an explicit passage while exposing its book trigger', () => {
    const onGoToChapter = vi.fn()
    const onOpenChange = vi.fn()
    const bookTriggerRef = { current: null }
    render(<HomePassagePicker compact bookTriggerRef={bookTriggerRef} onGoToChapter={onGoToChapter} onOpenChange={onOpenChange} />)
    const book = screen.getByRole('combobox', { name: 'Libro', exact: true })
    const chapter = screen.getByRole('combobox', { name: 'Capítulo', exact: true })
    const open = screen.getByRole('button', { name: 'Abrir capítulo', exact: true })

    expect(screen.getByTestId('reader-passage-picker')).toBeTruthy()
    expect(bookTriggerRef.current).toBe(book)
    expect(book.textContent).toBe('Seleccionar libro')
    expect(chapter.textContent).toBe('Capítulo')
    expect(chapter.disabled).toBe(true)
    expect(open.disabled).toBe(true)
    expect(open.getAttribute('aria-label')).toBe('Abrir capítulo')
    fireEvent.submit(screen.getByTestId('reader-passage-picker'))
    expect(onGoToChapter).not.toHaveBeenCalled()
    fireEvent.click(book)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    fireEvent.keyDown(book, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    chooseBook('Juan')
    expect(chapter.disabled).toBe(false)
    expect(open.disabled).toBe(true)
    chooseChapter(3)
    fireEvent.click(open)
    expect(onGoToChapter).toHaveBeenCalledExactlyOnceWith(43, 3)
  })

  it('keeps the chapter for the same book and clears it when the book changes', () => {
    const onGoToChapter = vi.fn()
    render(<HomePassagePicker onGoToChapter={onGoToChapter} />)
    const chapter = screen.getByRole('combobox', { name: 'Capítulo', exact: true })
    const open = screen.getByRole('button', { name: 'Abrir capítulo', exact: true })

    chooseBook('Salmos')
    expect(chapter.disabled).toBe(false)
    expect(open.disabled).toBe(true)
    chooseChapter(150)
    chooseBook('Salmos')
    expect(chapter.textContent).toBe('150')
    expect(open.disabled).toBe(false)

    chooseBook('Judas')
    expect(chapter.textContent).toBe('—')
    expect(open.disabled).toBe(true)
    fireEvent.click(chapter)
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['1'])
    fireEvent.click(screen.getByRole('option', { name: '1', exact: true }))
    fireEvent.click(open)
    expect(onGoToChapter).toHaveBeenCalledExactlyOnceWith(65, 1)
  })

  it('supports book typeahead with spaces and chapters 11 and 150 without losing focus', () => {
    const onGoToChapter = vi.fn()
    render(<HomePassagePicker onGoToChapter={onGoToChapter} />)
    const book = screen.getByRole('combobox', { name: 'Libro', exact: true })
    const chapter = screen.getByRole('combobox', { name: 'Capítulo', exact: true })

    act(() => book.focus())
    for (const key of '1 Corintios') {
      fireEvent.keyDown(book, { key })
      if (key === ' ') expect(fireEvent.keyUp(book, { key })).toBe(false)
    }
    fireEvent.keyDown(book, { key: 'Enter' })
    expect(book.textContent).toBe('1 Corintios')
    expect(document.activeElement).toBe(book)

    chooseBook('Salmos')
    act(() => chapter.focus())
    for (const key of '11') fireEvent.keyDown(chapter, { key })
    fireEvent.keyDown(chapter, { key: 'Enter' })
    expect(chapter.textContent).toBe('11')

    for (const key of '150') fireEvent.keyDown(chapter, { key })
    fireEvent.keyDown(chapter, { key: 'Enter' })
    expect(chapter.textContent).toBe('150')
    expect(document.activeElement).toBe(chapter)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir capítulo', exact: true }))
    expect(onGoToChapter).toHaveBeenCalledExactlyOnceWith(19, 150)
  })

  it('lets pending keyboard navigation be cancelled and closes on Tab or an outside pointer', () => {
    render(<HomePassagePicker onGoToChapter={vi.fn()} />)
    const book = screen.getByRole('combobox', { name: 'Libro', exact: true })
    act(() => book.focus())
    fireEvent.keyDown(book, { key: 'ArrowDown' })
    fireEvent.keyDown(book, { key: 'End' })
    const activeId = book.getAttribute('aria-activedescendant')
    expect(document.getElementById(activeId).textContent).toBe('Apocalipsis')
    fireEvent.keyDown(book, { key: 'Escape' })
    expect(book.textContent).toBe('Seleccionar libro')
    expect(book.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(book)

    fireEvent.keyDown(book, { key: 'ArrowDown' })
    expect(fireEvent.keyDown(book, { key: 'Tab' })).toBe(true)
    expect(screen.queryByRole('listbox')).toBeNull()

    fireEvent.click(book)
    expect(screen.getByRole('listbox', { name: 'Libro', exact: true })).toBeTruthy()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(book.hasAttribute('aria-activedescendant')).toBe(false)
  })
})
