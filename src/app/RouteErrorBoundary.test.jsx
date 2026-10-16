import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { lazy, Suspense } from 'react'
import { Link, MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestAppReload } from '../features/offline/appUpdates'
import { RouteErrorBoundary, RouteLoading } from './RouteErrorBoundary'

vi.mock('../features/offline/appUpdates', () => ({ requestAppReload: vi.fn() }))
vi.mock('../features/home/HomeHeader', () => ({ HomeHeader: () => <header data-testid="recovery-header">Santa Biblia</header> }))
vi.mock('../i18n', () => ({
  useI18n: () => ({ t: key => ({
    'appRecovery.loading': 'Cargando…',
    'appRecovery.loadErrorTitle': 'No pudimos abrir esta página',
    'appRecovery.loadErrorBody': 'Comprueba tu conexión y vuelve a intentarlo.',
    'appRecovery.reload': 'Recargar página',
    'appRecovery.goHome': 'Ir al inicio',
  }[key] ?? key) }),
}))

const chunkError = 'Failed to fetch dynamically imported module'
const preventExpectedError = (event) => {
  if (event.error?.message === chunkError) event.preventDefault()
}

function BrokenPage() {
  throw new Error(chunkError)
}

function PageByLocation() {
  const { pathname, search } = useLocation()
  if (pathname === '/broken' && search === '?fail=1') return <BrokenPage />
  return <h1>Página disponible</h1>
}

describe('route recovery', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(requestAppReload).mockResolvedValue(undefined)
    window.addEventListener('error', preventExpectedError)
  })

  afterEach(() => {
    cleanup()
    window.removeEventListener('error', preventExpectedError)
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('keeps sibling navigation available when a lazy chunk rejects and never reloads automatically', async () => {
    const FailedLazyPage = lazy(() => Promise.reject(new Error(chunkError)))
    render(
      <MemoryRouter initialEntries={['/bible']}>
        <nav aria-label="Navegación principal"><Link to="/">Inicio</Link></nav>
        <RouteErrorBoundary><Suspense fallback={<RouteLoading />}><FailedLazyPage /></Suspense></RouteErrorBoundary>
      </MemoryRouter>,
    )

    expect((await screen.findByRole('alert')).textContent).toContain('No pudimos abrir esta página')
    expect(screen.getByRole('alert').textContent).toContain('Comprueba tu conexión y vuelve a intentarlo.')
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Inicio' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: 'Ir al inicio' }).getAttribute('href')).toBe('/')
    expect(screen.queryByTestId('recovery-header')).toBeNull()
    expect(requestAppReload).not.toHaveBeenCalled()
  })

  it('reloads only after an explicit click and keeps the action available if reload fails', async () => {
    vi.mocked(requestAppReload).mockRejectedValueOnce(new Error('Worker activation timed out'))
    render(<MemoryRouter><RouteErrorBoundary><BrokenPage /></RouteErrorBoundary></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Recargar página' }))

    expect(requestAppReload).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Recargar página' }).disabled).toBe(false))
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it.each(['/', '/read/43/3/1'])('restores the shared header when the failed page normally supplies it: %s', (path) => {
    render(<MemoryRouter initialEntries={[path]}><RouteErrorBoundary><BrokenPage /></RouteErrorBoundary></MemoryRouter>)

    expect(screen.getByTestId('recovery-header')).toBeTruthy()
  })

  it.each([
    ['pathname', '/healthy?fail=1'],
    ['query', '/broken?fail=0'],
  ])('clears the error on a %s change so another page can render', (_, destination) => {
    render(
      <MemoryRouter initialEntries={['/broken?fail=1']}>
        <Link to={destination}>Continuar</Link>
        <RouteErrorBoundary><PageByLocation /></RouteErrorBoundary>
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()

    fireEvent.click(screen.getByRole('link', { name: 'Continuar' }))

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Página disponible' })).toBeTruthy()
    expect(requestAppReload).not.toHaveBeenCalled()
  })

  it('announces translated loading text inside the existing loading placeholder', () => {
    render(<RouteLoading />)

    const status = screen.getByRole('status')
    expect(status.classList.contains('route-loading')).toBe(true)
    expect(status.getAttribute('aria-live')).toBe('polite')
    expect(status.textContent).toBe('Cargando…')
  })
})
