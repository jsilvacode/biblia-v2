import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '../../i18n'
import { SettingsProvider } from '../settings/SettingsProvider'
import { InstallInvitation } from './InstallInvitation'
import {
  INSTALL_INVITATION_DISMISSED_KEY,
  InstallProvider,
  useInstall,
} from './InstallProvider'
import { InstallSettings } from './InstallSettings'

function createStorage() {
  const values = new Map()
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  }
}

function createInstallPrompt(outcome = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  const prompt = vi.fn().mockResolvedValue(undefined)
  Object.defineProperties(event, {
    prompt: { value: prompt },
    userChoice: { value: Promise.resolve({ outcome }) },
  })
  return { event, prompt }
}

function Harness() {
  const {
    dismissFirstOffer,
    requestInstall,
    shouldOffer,
    status,
  } = useInstall()

  return (
    <div>
      <output data-testid="status">{status}</output>
      <output data-testid="offer">{String(shouldOffer)}</output>
      <button onClick={requestInstall} type="button">Request install</button>
      <button onClick={dismissFirstOffer} type="button">Dismiss offer</button>
    </div>
  )
}

function renderInstallUi() {
  return render(
    <SettingsProvider>
      <InstallProvider>
        <LocaleProvider>
          <InstallInvitation />
          <InstallSettings />
        </LocaleProvider>
      </InstallProvider>
    </SettingsProvider>,
  )
}

describe('InstallProvider', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: createStorage() })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        addEventListener: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
      })),
    })
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: false })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('captures the browser event and only opens its prompt after a user action', async () => {
    render(<InstallProvider><Harness /></InstallProvider>)
    const { event, prompt } = createInstallPrompt('accepted')

    fireEvent(window, event)

    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByTestId('status').textContent).toBe('promptable')
    expect(screen.getByTestId('offer').textContent).toBe('true')
    expect(prompt).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Request install' }))

    await waitFor(() => expect(prompt).toHaveBeenCalledOnce())
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('unavailable'))
  })

  it('applies a persistent 30-day cooldown after an explicit dismissal', () => {
    render(<InstallProvider><Harness /></InstallProvider>)
    fireEvent(window, createInstallPrompt().event)
    expect(screen.getByTestId('offer').textContent).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss offer' }))

    expect(screen.getByTestId('offer').textContent).toBe('false')
    expect(Number(window.localStorage.getItem(INSTALL_INVITATION_DISMISSED_KEY))).toBeGreaterThan(0)
  })

  it('clears the pending prompt when installation completes', () => {
    render(<InstallProvider><Harness /></InstallProvider>)
    fireEvent(window, createInstallPrompt().event)

    fireEvent(window, new Event('appinstalled'))

    expect(screen.getByTestId('status').textContent).toBe('installed')
    expect(screen.getByTestId('offer').textContent).toBe('false')
  })

  it('offers a lightweight invitation on Home while keeping installation in Settings', () => {
    renderInstallUi()
    expect(screen.getByRole('heading', { name: 'Instalar aplicación' })).toBeTruthy()
    expect(screen.queryByText('Instala Santa Biblia')).toBeNull()

    fireEvent(window, createInstallPrompt().event)

    expect(screen.getByText('Instala Santa Biblia')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Instalar' }).length).toBeGreaterThanOrEqual(1)
  })
})
