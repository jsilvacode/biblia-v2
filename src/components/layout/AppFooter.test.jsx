import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { reloadMock } = vi.hoisted(() => ({ reloadMock: vi.fn() }))
vi.mock('../../features/offline/appUpdates', () => ({ requestAppReload: reloadMock }))

const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')
let expectedChunkErrorHandler

async function renderFooter() {
  const [{ LocaleProvider }, { SettingsProvider }, { AppFooter }] = await Promise.all([
    import('../../i18n'),
    import('../../features/settings/SettingsProvider'),
    import('./AppFooter'),
  ])
  return render(<SettingsProvider><LocaleProvider><AppFooter /></LocaleProvider></SettingsProvider>)
}

beforeEach(() => {
  vi.resetModules()
  vi.doUnmock('./ProjectInformationDialog')
  reloadMock.mockReset().mockResolvedValue(undefined)
  const values = new Map()
  Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  } })
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.doUnmock('./ProjectInformationDialog')
  if (expectedChunkErrorHandler) window.removeEventListener('error', expectedChunkErrorHandler)
  expectedChunkErrorHandler = undefined
  if (originalStorage) Object.defineProperty(window, 'localStorage', originalStorage)
  else delete window.localStorage
  delete document.documentElement.dataset.theme
  document.documentElement.style.removeProperty('--reader-scale')
})

describe('deferred footer information', () => {
  it('opens the requested dialog and restores its trigger focus after Escape', async () => {
    await renderFooter()
    const trigger = screen.getByRole('button', { name: 'Ayuda', exact: true })
    expect(screen.queryByRole('dialog')).toBeNull()
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Ayuda para usar Santa Biblia' })
    const closeButton = within(dialog).getByRole('button', { name: 'Cerrar', exact: true })
    expect(within(dialog).getByRole('heading', { name: 'Empezar o continuar una lectura' })).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(closeButton))

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(trigger))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('contains a rejected dialog chunk while keeping the footer and recovery actions usable', async () => {
    vi.doMock('./ProjectInformationDialog', () => { throw new Error('Dialog chunk unavailable') })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expectedChunkErrorHandler = (event) => {
      if (event.error?.cause?.message === 'Dialog chunk unavailable') event.preventDefault()
    }
    window.addEventListener('error', expectedChunkErrorHandler)
    await renderFooter()
    const trigger = screen.getByRole('button', { name: 'Ayuda', exact: true })
    trigger.focus()
    fireEvent.click(trigger)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Comprueba tu conexión y vuelve a intentarlo.')
    expect(within(screen.getByRole('contentinfo')).getByRole('navigation', { name: 'Información del proyecto' })).toBeTruthy()
    const closeButton = within(alert).getByRole('button', { name: 'Cerrar', exact: true })
    await waitFor(() => expect(document.activeElement).toBe(closeButton))

    const reloadButton = within(alert).getByRole('button', { name: 'Recargar página' })
    fireEvent.click(reloadButton)
    await waitFor(() => expect(reloadMock).toHaveBeenCalledOnce())
    await waitFor(() => expect(reloadButton.disabled).toBe(false))
    fireEvent.click(closeButton)
    expect(screen.queryByRole('alert')).toBeNull()
    expect(document.activeElement).toBe(trigger)
    expect(screen.getByRole('contentinfo')).toBeTruthy()
  })
})
