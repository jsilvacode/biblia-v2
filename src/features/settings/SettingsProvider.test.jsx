import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SettingsProvider, useSettings } from './SettingsProvider'

const STORAGE_KEY = 'santa_biblia_v2_settings'

function createStorage(initialValue = null, { failWrites = false } = {}) {
  const values = new Map(initialValue == null ? [] : [[STORAGE_KEY, initialValue]])
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => {
      if (failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      values.set(key, String(value))
    },
  }
}

function createColorScheme(initialMatches = false) {
  let matches = initialMatches
  const listeners = new Set()
  const media = {
    get matches() {
      return matches
    },
    addEventListener: (_name, listener) => listeners.add(listener),
    removeEventListener: (_name, listener) => listeners.delete(listener),
  }

  return {
    media,
    setMatches(nextMatches) {
      matches = nextMatches
      listeners.forEach((listener) => listener({ matches }))
    },
  }
}

function SettingsProbe() {
  const { resolvedTheme, settings, updateSetting } = useSettings()
  return (
    <>
      <output data-testid="settings">{JSON.stringify(settings)}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <button type="button" onClick={() => updateSetting('theme', 'invalid')}>Invalid theme</button>
      <button type="button" onClick={() => updateSetting('locale', 'pt-BR')}>Português</button>
    </>
  )
}

function renderProvider() {
  return render(<SettingsProvider><SettingsProbe /></SettingsProvider>)
}

describe('SettingsProvider', () => {
  let colorScheme

  beforeEach(() => {
    colorScheme = createColorScheme(false)
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => colorScheme.media,
    })
  })

  afterEach(() => {
    cleanup()
    delete document.documentElement.dataset.theme
    document.documentElement.style.removeProperty('--reader-scale')
  })

  it('sanitizes every persisted setting before exposing it to the app', () => {
    const stored = JSON.stringify({
      bibleVersion: 'unknown',
      fontFamily: 'comic',
      locale: 'fr',
      readerFontScale: 99,
      readerLineHeight: 'huge',
      theme: 'neon',
      unexpected: 'value',
    })
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorage(stored),
    })

    renderProvider()

    expect(JSON.parse(screen.getByTestId('settings').textContent)).toEqual({
      bibleVersion: 'nbla',
      fontFamily: 'serif',
      locale: 'es',
      readerFontScale: 1.3,
      readerLineHeight: 'comfortable',
      theme: 'system',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Invalid theme' }))
    expect(JSON.parse(screen.getByTestId('settings').textContent).theme).toBe('system')
  })

  it('updates the resolved system theme when the OS preference changes', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorage(),
    })
    renderProvider()

    expect(screen.getByTestId('resolved-theme').textContent).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')

    act(() => colorScheme.setMatches(true))

    await waitFor(() => expect(screen.getByTestId('resolved-theme').textContent).toBe('dark'))
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('keeps working when localStorage refuses writes', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createStorage(null, { failWrites: true }),
    })

    expect(() => renderProvider()).not.toThrow()
    fireEvent.click(screen.getByRole('button', { name: 'Português' }))
    expect(JSON.parse(screen.getByTestId('settings').textContent).locale).toBe('pt-BR')
  })
})
