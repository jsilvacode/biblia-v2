import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePassagePicker } from './HomePassagePicker'

vi.mock('../../i18n', () => ({ useI18n: () => ({ locale: 'es', t: (key, values = {}) => ({
  'home.selectBook': 'Seleccionar libro', 'home.chooseReading': 'Elegir una lectura',
  'common.close': 'Cerrar', 'bible.oldTestament': 'Antiguo Testamento', 'bible.newTestament': 'Nuevo Testamento',
  'bible.chapters': 'Capítulos', 'bible.shortChapterCount': `${values.count} cap.`, 'bible.openReference': `Abrir ${values.reference}`,
}[key] ?? key) }) }))
vi.mock('../settings/SettingsProvider', () => ({ useSettings: () => ({ settings: { bibleVersion: 'nbla' } }) }))
vi.mock('../reader/preloadReading', () => ({ preloadReading: vi.fn() }))

const trigger = () => screen.getByRole('button', { name: 'Seleccionar libro', exact: true })
const book = (name) => screen.getByRole('button', { name: new RegExp(`^${name} \\d+ cap\\.$`) })

describe('accordion passage picker', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 40, y: 180, left: 40, top: 180, right: 320, bottom: 234, width: 280, height: 54 })
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('starts clean with one selector and no chapter selector or submit button', () => {
    render(<HomePassagePicker onGoToChapter={vi.fn()} />)
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(trigger())
    expect(screen.getAllByRole('button').filter(node => node.hasAttribute('data-book-id'))).toHaveLength(66)
  })

  it('opens chapters inside the list and closes them with either the book name or its X', () => {
    render(<HomePassagePicker onGoToChapter={vi.fn()} />)
    fireEvent.click(trigger())
    fireEvent.click(book('Juan'))
    expect(screen.getAllByRole('button', { name: /^Abrir Juan / })).toHaveLength(21)
    fireEvent.click(book('Juan'))
    expect(screen.queryByRole('button', { name: 'Abrir Juan 1', exact: true })).toBeNull()
    fireEvent.click(book('Juan'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar: Juan' }))
    expect(book('Juan').getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(book('Juan'))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('expands only one book and immediately navigates from its chapter, including 150 and 1', () => {
    const navigate = vi.fn()
    render(<HomePassagePicker onGoToChapter={navigate} />)
    fireEvent.click(trigger())
    fireEvent.click(book('Salmos'))
    expect(screen.getAllByRole('button', { name: /^Abrir Salmos / })).toHaveLength(150)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Salmos 150', exact: true }))
    expect(navigate).toHaveBeenLastCalledWith(19, 150)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(trigger())
    fireEvent.click(book('Judas'))
    expect(screen.queryByRole('button', { name: /^Abrir Salmos / })).toBeNull()
    expect(screen.getAllByRole('button', { name: /^Abrir Judas / })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Judas 1' }))
    expect(navigate).toHaveBeenLastCalledWith(65, 1)
  })

  it('uses the same neutral selector in the reader and notifies immersion on open, close and unmount', () => {
    const onOpenChange = vi.fn()
    const bookTriggerRef = { current: null }
    const view = render(<HomePassagePicker compact bookTriggerRef={bookTriggerRef} onOpenChange={onOpenChange} onGoToChapter={vi.fn()} />)
    expect(screen.getByTestId('reader-passage-picker')).toBeTruthy()
    expect(bookTriggerRef.current).toBe(trigger())
    fireEvent.click(trigger())
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    fireEvent.keyDown(trigger(), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(document.activeElement).toBe(trigger())
    fireEvent.click(trigger())
    view.unmount()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('supports keyboard book navigation and typeahead with spaces without selecting a chapter', () => {
    const navigate = vi.fn()
    render(<HomePassagePicker onGoToChapter={navigate} />)
    act(() => trigger().focus())
    fireEvent.keyDown(trigger(), { key: 'ArrowDown' })
    expect(document.activeElement).toBe(book('Génesis'))
    fireEvent.keyDown(document.activeElement, { key: 'End' })
    expect(document.activeElement).toBe(book('Apocalipsis'))
    for (const key of '1 Corintios') {
      fireEvent.keyDown(document.activeElement, { key })
      if (key === ' ') expect(fireEvent.keyUp(document.activeElement, { key })).toBe(false)
    }
    expect(document.activeElement).toBe(book('1 Corintios'))
    expect(navigate).not.toHaveBeenCalled()
    fireEvent.click(document.activeElement)
    expect(screen.getAllByRole('button', { name: /^Abrir 1 Corintios / })).toHaveLength(16)
  })

  it('dismisses the menu with its X, an outside pointer or focus leaving the whole control', () => {
    render(<HomePassagePicker onGoToChapter={vi.fn()} />)
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar', exact: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger())
    fireEvent.click(trigger())
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(trigger())
    fireEvent.blur(trigger(), { relatedTarget: document.body })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps Safari button taps alive when focus moves to an ancestor of the popup', () => {
    const navigate = vi.fn()
    render(<HomePassagePicker onGoToChapter={navigate} />)
    fireEvent.click(trigger())
    fireEvent.click(book('Juan'))
    const chapter = screen.getByRole('button', { name: 'Abrir Juan 3', exact: true })
    fireEvent.pointerDown(chapter)
    fireEvent.blur(book('Juan'), { relatedTarget: document.body })
    fireEvent.click(chapter)
    expect(navigate).toHaveBeenCalledExactlyOnceWith(43, 3)
  })
})
