import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import BeliefsPage from './BeliefsPage'

vi.mock('../../i18n', () => ({ useI18n: () => ({ locale: 'es', t: (key) => key }) }))
vi.mock('../settings/SettingsProvider', () => ({
  useSettings: () => ({ settings: { bibleVersion: 'nbla' }, resolvedTheme: 'light' }),
}))

function chapter(number) {
  return {
    bookChapterTitle: `Exposición ${number}`, printedPages: [number, number + 1], references: [],
    blocks: [{ kind: 'paragraph', text: `Texto exclusivo de la creencia ${number}`, pdfPage: number }],
  }
}

function KeyedBeliefsPage() {
  const { pathname, search } = useLocation()
  return <BeliefsPage key={pathname + search} />
}

function renderBelief(path = '/beliefs/las-sagradas-escrituras') {
  return render(<MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/beliefs" element={<KeyedBeliefsPage />} />
      <Route path="/beliefs/:slug" element={<KeyedBeliefsPage />} />
    </Routes>
  </MemoryRouter>)
}

beforeEach(() => {
  window.sessionStorage.clear()
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('official declaration reading layout', () => {
  it('uses literary reference labels and places notes after the collapsed exposition', () => {
    renderBelief()
    const references = screen.getByRole('region', { name: 'Referencias bíblicas de la declaración oficial' })
    expect(references.textContent).toContain('Sal. 119:105')
    expect(references.querySelector('svg')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Su fundamento en la Biblia' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Abrir referencias bíblicas: Salmos 119:105' })).toBeTruthy()
    const expansion = screen.getByRole('region', { name: 'Exposición ampliada: Las Sagradas Escrituras' })
    const notes = screen.getByRole('button', { name: /Notas sobre la versión/ })
    expect(expansion.compareDocumentPosition(notes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: /Leer la exposición completa/ }).getAttribute('aria-expanded')).toBe('false')
  })
})

describe('expanded belief loading', () => {
  it('loads only on demand and clears the prior exposition when moving to the next belief', async () => {
    const fetchChapter = vi.fn(async (url) => ({ ok: true, json: async () => chapter(url.endsWith('01.json') ? 1 : 2) }))
    vi.stubGlobal('fetch', fetchChapter)
    renderBelief()
    expect(fetchChapter).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Leer la exposición completa/ }))
    await screen.findByText('Texto exclusivo de la creencia 1')
    fireEvent.click(screen.getByRole('link', { name: /Creencia siguiente/ }))
    expect(screen.queryByText('Texto exclusivo de la creencia 1')).toBeNull()
    expect(screen.getByRole('button', { name: /Leer la exposición completa/ }).getAttribute('aria-expanded')).toBe('false')
    expect(fetchChapter).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /Leer la exposición completa/ }))
    await screen.findByText('Texto exclusivo de la creencia 2')
    expect(fetchChapter.mock.calls.map(([url]) => url)).toEqual(['/data/beliefs/chapters/01.json', '/data/beliefs/chapters/02.json'])
  })

  it('aborts the prior request and ignores a late response after changing belief', async () => {
    let resolveFirst
    const fetchChapter = vi.fn((url) => url.endsWith('01.json')
      ? new Promise((resolve) => { resolveFirst = resolve })
      : Promise.resolve({ ok: true, json: async () => chapter(2) }))
    vi.stubGlobal('fetch', fetchChapter)
    renderBelief()
    fireEvent.click(screen.getByRole('button', { name: /Leer la exposición completa/ }))
    await waitFor(() => expect(fetchChapter).toHaveBeenCalledTimes(1))
    const firstSignal = fetchChapter.mock.calls[0][1].signal
    fireEvent.click(screen.getByRole('link', { name: /Creencia siguiente/ }))
    expect(firstSignal.aborted).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Leer la exposición completa/ }))
    await screen.findByText('Texto exclusivo de la creencia 2')
    await act(async () => resolveFirst({ ok: true, json: async () => chapter(1) }))
    expect(screen.queryByText('Texto exclusivo de la creencia 1')).toBeNull()
    expect(screen.getByText('Texto exclusivo de la creencia 2')).toBeTruthy()
  })
})


describe('belief explorer pagination', () => {
  it('resets the visible batch with filters and preserves it while reading and returning', () => {
    renderBelief('/beliefs')
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(9)
    fireEvent.click(screen.getByRole('button', { name: /Mostrar 9 creencias más/ }))
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(18)
    fireEvent.click(screen.getByRole('link', { name: /^1\. Las Sagradas Escrituras:/ }))
    fireEvent.click(screen.getByRole('link', { name: /El recorrido completo/ }))
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(18)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } })
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(9)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Mostrar 9 creencias más/ }))
    fireEvent.click(screen.getByRole('button', { name: /^La iglesia / }))
    expect(screen.getAllByRole('link', { name: /: leer creencia/ }).length).toBeLessThanOrEqual(9)
    fireEvent.click(screen.getByRole('button', { name: /^Todas / }))
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(9)
  })

  it('changes to a fresh mobile batch when the viewport crosses the breakpoint', () => {
    const mobileViewport = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }
    vi.stubGlobal('matchMedia', vi.fn(() => mobileViewport))
    const view = renderBelief('/beliefs')
    fireEvent.click(screen.getByRole('button', { name: /Mostrar 9 creencias más/ }))
    const onViewportChange = mobileViewport.addEventListener.mock.calls[0][1]
    act(() => { mobileViewport.matches = true; onViewportChange() })
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(3)
    view.unmount()
    expect(mobileViewport.removeEventListener).toHaveBeenCalledWith('change', onViewportChange)
  })
})


describe('direct belief navigation', () => {
  it('offers every belief on mobile and follows the current detail selection', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    renderBelief('/beliefs')
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(3)
    const selector = screen.getByRole('combobox', { name: 'Ir a una creencia' })
    expect(selector.querySelectorAll('option')).toHaveLength(29)
    expect(selector.querySelectorAll('optgroup')).toHaveLength(6)
    expect(selector.value).toBe('')
    fireEvent.change(selector, { target: { value: 'las-sagradas-escrituras' } })
    expect(screen.getByRole('heading', { level: 1, name: 'Las Sagradas Escrituras' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Ir a una creencia' }).value).toBe('las-sagradas-escrituras')
    expect(screen.getByRole('link', { name: 'Volver a las 28 creencias' })).toBeTruthy()
    fireEvent.change(screen.getByRole('combobox', { name: 'Ir a una creencia' }), { target: { value: 'la-trinidad' } })
    expect(screen.getByRole('heading', { level: 1, name: /Trinidad/ })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Ir a una creencia' }).value).toBe('la-trinidad')
  })

  it('returns to the same search, category and visible batch from the detail toolbar', () => {
    renderBelief('/beliefs')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } })
    fireEvent.click(screen.getByRole('button', { name: /Mostrar 9 creencias más/ }))
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(18)
    fireEvent.change(screen.getByRole('combobox', { name: 'Ir a una creencia' }), { target: { value: 'las-sagradas-escrituras' } })
    fireEvent.click(screen.getByRole('link', { name: 'Volver a las 28 creencias' }))
    expect(screen.getByRole('searchbox').value).toBe('a')
    expect(screen.getByRole('button', { name: /^Todas / }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByRole('link', { name: /: leer creencia/ })).toHaveLength(18)
    fireEvent.click(screen.getByRole('button', { name: /^La iglesia / }))
    const filteredNames = screen.getAllByRole('link', { name: /: leer creencia/ }).map((link) => link.getAttribute('aria-label'))
    fireEvent.change(screen.getByRole('combobox', { name: 'Ir a una creencia' }), { target: { value: 'las-sagradas-escrituras' } })
    fireEvent.click(screen.getByRole('link', { name: 'Volver a las 28 creencias' }))
    expect(screen.getByRole('searchbox').value).toBe('a')
    expect(screen.getByRole('button', { name: /^La iglesia / }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByRole('link', { name: /: leer creencia/ }).map((link) => link.getAttribute('aria-label'))).toEqual(filteredNames)
  })
})


it('keeps navigation available when session storage is unavailable', () => {
  vi.stubGlobal('sessionStorage', {
    getItem: () => { throw new Error('Storage disabled') },
    setItem: () => { throw new Error('Storage disabled') },
  })
  renderBelief('/beliefs')
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } })
  fireEvent.change(screen.getByRole('combobox', { name: 'Ir a una creencia' }), { target: { value: 'las-sagradas-escrituras' } })
  expect(screen.getByRole('heading', { level: 1, name: 'Las Sagradas Escrituras' })).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: 'Volver a las 28 creencias' }))
  expect(screen.getByRole('combobox', { name: 'Ir a una creencia' }).querySelectorAll('option')).toHaveLength(29)
})
