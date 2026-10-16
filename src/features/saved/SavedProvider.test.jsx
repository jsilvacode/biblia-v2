import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n'
import en from '../../i18n/locales/en'
import es from '../../i18n/locales/es'
import ptBR from '../../i18n/locales/pt-BR'
import { SettingsProvider } from '../settings/SettingsProvider'
import SavedPage from './SavedPage'
import { SavedProvider, useSaved } from './SavedProvider'
import { bookmarkId, savedStorage, SavedStorageError } from './savedStorage'

const reference = { version: 'nbla', book: 43, chapter: 3, verse: 16 }
const entry = { ...reference, id: bookmarkId(reference), createdAt: 1 }
const empty = { bookmarks: [], highlights: [] }

function deferred() {
  let resolve
  let reject
  const promise = new Promise((onResolve, onReject) => { resolve = onResolve; reject = onReject })
  return { promise, resolve, reject }
}

describe('saved provider', () => {
  beforeEach(() => {
    const values = new Map()
    Object.defineProperty(window, 'localStorage', { configurable: true, value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
      clear: () => values.clear(),
    } })
    vi.spyOn(savedStorage, 'read').mockResolvedValue(empty)
    vi.spyOn(savedStorage, 'toggleBookmark').mockResolvedValue({ entries: [entry], active: true })
    vi.spyOn(savedStorage, 'toggleHighlight').mockResolvedValue({ entries: [entry], active: true })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('does not write after a failed initial read and recovers the existing collection on retry', async () => {
    const error = new SavedStorageError('read')
    savedStorage.read.mockRejectedValueOnce(error).mockResolvedValue({ bookmarks: [entry], highlights: [] })
    const { result } = renderHook(() => useSaved(), { wrapper: SavedProvider })
    await waitFor(() => expect(result.current.loadError).toBe(error))
    expect(result.current.isReady).toBe(false)
    await act(async () => { await expect(result.current.toggleBookmark(reference)).rejects.toBe(error) })
    expect(savedStorage.toggleBookmark).not.toHaveBeenCalled()
    await act(async () => { await result.current.retry() })
    expect(result.current.isReady).toBe(true)
    expect(result.current.isBookmarked(reference)).toBe(true)
    expect(result.current.bookmarks).toEqual([entry])
  })

  it.each(['Bookmark', 'Highlight'])('publishes a %s only after persistence succeeds and leaves failed writes unchanged', async (kind) => {
    const gate = deferred()
    savedStorage[`toggle${kind}`].mockReturnValueOnce(gate.promise)
    const { result } = renderHook(() => useSaved(), { wrapper: SavedProvider })
    await waitFor(() => expect(result.current.isReady).toBe(true))
    let pending
    act(() => { pending = result.current[`toggle${kind}`](reference) })
    const failure = expect(pending).rejects.toBeInstanceOf(Error)
    await waitFor(() => expect(savedStorage[`toggle${kind}`]).toHaveBeenCalledTimes(1))
    expect(result.current[kind === 'Bookmark' ? 'isBookmarked' : 'isHighlighted'](reference)).toBe(false)
    await act(async () => { gate.reject(new SavedStorageError('write')); await failure })
    expect(result.current[kind === 'Bookmark' ? 'bookmarks' : 'highlights']).toEqual([])
    await act(async () => { await expect(result.current[`toggle${kind}`](reference)).resolves.toBe(true) })
    expect(result.current[kind === 'Bookmark' ? 'isBookmarked' : 'isHighlighted'](reference)).toBe(true)
  })

  it('serializes concurrent actions and continues the queue after an earlier failure', async () => {
    const gate = deferred()
    const psalm = { version: 'nbla', book: 19, chapter: 23, verse: 1 }
    const psalmEntry = { ...psalm, id: bookmarkId(psalm), createdAt: 2 }
    savedStorage.toggleBookmark.mockReturnValueOnce(gate.promise).mockResolvedValueOnce({ entries: [psalmEntry], active: true })
    const { result } = renderHook(() => useSaved(), { wrapper: SavedProvider })
    await waitFor(() => expect(result.current.isReady).toBe(true))
    let first
    let second
    act(() => {
      first = result.current.toggleBookmark(reference)
      second = result.current.toggleBookmark(psalm)
    })
    const failure = expect(first).rejects.toBeInstanceOf(Error)
    await waitFor(() => expect(savedStorage.toggleBookmark).toHaveBeenCalledTimes(1))
    await act(async () => { gate.reject(new SavedStorageError('write')); await failure; await second })
    expect(savedStorage.toggleBookmark).toHaveBeenCalledTimes(2)
    expect(result.current.bookmarks).toEqual([psalmEntry])
  })

  it.each([['es', es], ['en', en], ['pt-BR', ptBR]])('shows loading and a recoverable error rather than an empty collection in %s', async (locale, dictionary) => {
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({ locale, theme: 'light' }))
    const gate = deferred()
    savedStorage.read.mockReturnValueOnce(gate.promise).mockResolvedValue({ bookmarks: [entry], highlights: [] })
    render(<MemoryRouter><SettingsProvider><LocaleProvider><SavedProvider><SavedPage /></SavedProvider></LocaleProvider></SettingsProvider></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(dictionary.saved.loading))
    expect(screen.queryByText(dictionary.saved.empty)).toBeNull()
    await act(async () => { gate.reject(new SavedStorageError('read')) })
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(dictionary.saved.loadError))
    expect(screen.queryByText(dictionary.saved.empty)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: dictionary.saved.retry, exact: true }))
    await waitFor(() => expect(screen.getByRole('link', { name: /3:16/ }).getAttribute('href')).toBe('/read/43/3/16?v=nbla'))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
