import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LocaleProvider } from '../../i18n'
import { ReaderFontSizeControl } from './ReaderFontSizeControl'
import { SettingsProvider } from './SettingsProvider'

function renderControl() {
  return render(
    <SettingsProvider>
      <LocaleProvider>
        <ReaderFontSizeControl compact />
      </LocaleProvider>
    </SettingsProvider>,
  )
}

describe('ReaderFontSizeControl', () => {
  beforeEach(() => {
    const storage = new Map()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => storage.get(key) ?? null,
        removeItem: (key) => storage.delete(key),
        setItem: (key, value) => storage.set(key, String(value)),
      },
    })
  })
  afterEach(() => {
    cleanup()
    document.documentElement.style.removeProperty('--reader-scale')
  })

  it('exposes the current value and applies changes to the shared reading scale', async () => {
    renderControl()

    expect(screen.getByText('Tamaño del texto')).toBeTruthy()
    expect(screen.getByText('100%')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar texto' }))

    expect(screen.getByText('105%')).toBeTruthy()
    await waitFor(() => expect(document.documentElement.style.getPropertyValue('--reader-scale')).toBe('1.05'))
  })
})
