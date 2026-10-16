import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReaderBottomNavigation } from './ReaderBottomNavigation'

vi.mock('../../i18n', () => ({
  useI18n: () => ({ t: (key) => ({
    'app.name': 'Santa Biblia', 'nav.home': 'Inicio', 'nav.bible': 'Biblia',
    'nav.search': 'Buscar', 'nav.saved': 'Guardados',
  }[key] ?? key) }),
}))

afterEach(cleanup)

describe('reader primary navigation', () => {
  it('keeps the primary destinations in the same order while Bible opens its picker', () => {
    const onOpenBible = vi.fn()
    const view = render(<MemoryRouter><ReaderBottomNavigation onOpenBible={onOpenBible} /></MemoryRouter>)
    const navigation = screen.getByRole('navigation', { name: 'Santa Biblia' })
    expect(Array.from(navigation.children, (item) => item.textContent)).toEqual(['Inicio', 'Biblia', 'Buscar', 'Guardados'])
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/', '/search', '/saved'])

    const bible = screen.getByRole('button', { name: 'Biblia' })
    expect(bible.getAttribute('aria-haspopup')).toBe('dialog')
    expect(bible.getAttribute('aria-current')).toBe('page')
    expect(bible.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(bible)
    expect(onOpenBible).toHaveBeenCalledOnce()
    view.rerender(<MemoryRouter><ReaderBottomNavigation bibleIsOpen onOpenBible={onOpenBible} /></MemoryRouter>)
    expect(bible.getAttribute('aria-expanded')).toBe('true')
  })
})
