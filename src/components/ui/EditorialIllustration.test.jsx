import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SettingsProvider, useSettings } from '../../features/settings/SettingsProvider'
import { EditorialIllustration } from './EditorialIllustration'

function ThemeControls() {
  const { updateSetting } = useSettings()
  return <button onClick={() => updateSetting('theme', 'light')} type="button">Use light theme</button>
}

describe('EditorialIllustration', () => {
  let systemDark
  let mediaListeners
  let storedSettings
  const originalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')

  beforeEach(() => {
    systemDark = false
    mediaListeners = new Set()
    storedSettings = new Map()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => storedSettings.get(key) ?? null,
        setItem: (key, value) => storedSettings.set(key, String(value)),
      },
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        matches: systemDark,
        addEventListener: (_event, listener) => mediaListeners.add(listener),
        removeEventListener: (_event, listener) => mediaListeners.delete(listener),
      }),
    })
  })

  afterEach(() => {
    cleanup()
    if (originalStorage) Object.defineProperty(window, 'localStorage', originalStorage)
    if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia)
    else delete window.matchMedia
    delete document.documentElement.dataset.theme
    document.documentElement.style.removeProperty('--reader-scale')
  })

  it('changes the source on the same decorative image when the explicit theme changes', () => {
    storedSettings.set('santa_biblia_v2_settings', JSON.stringify({ theme: 'dark' }))
    const { container } = render(
      <SettingsProvider>
        <EditorialIllustration alt="" aria-hidden="true" className="opening-art" decoding="async" height="1024" loading="lazy" src="/assets/editorial/faith-v2.webp" width="1536" />
        <ThemeControls />
      </SettingsProvider>,
    )
    const image = container.querySelector('img')
    expect(image.getAttribute('src')).toBe('/assets/editorial/faith-night-v2.webp')
    expect(image.getAttribute('alt')).toBe('')
    expect(image.getAttribute('aria-hidden')).toBe('true')
    expect(image.className).toBe('editorial-illustration opening-art')
    expect(image.getAttribute('loading')).toBe('lazy')
    expect(image.getAttribute('width')).toBe('1536')

    fireEvent.click(screen.getByRole('button', { name: 'Use light theme' }))

    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(container.querySelector('img')).toBe(image)
    expect(image.getAttribute('src')).toBe('/assets/editorial/faith-v2.webp')
  })

  it('follows system preference changes through SettingsProvider', () => {
    const { container } = render(<SettingsProvider><EditorialIllustration src="/assets/editorial/search-v1.webp" /></SettingsProvider>)
    const image = container.querySelector('img')
    expect(image.getAttribute('src')).toBe('/assets/editorial/search-v1.webp')

    act(() => {
      systemDark = true
      mediaListeners.forEach((listener) => listener({ matches: true }))
    })
    expect(image.getAttribute('src')).toBe('/assets/editorial/search-night-v1.webp')

    act(() => {
      systemDark = false
      mediaListeners.forEach((listener) => listener({ matches: false }))
    })
    expect(image.getAttribute('src')).toBe('/assets/editorial/search-v1.webp')
  })

  it('leaves other image sources unchanged', () => {
    storedSettings.set('santa_biblia_v2_settings', JSON.stringify({ theme: 'dark' }))
    const { container } = render(<SettingsProvider><EditorialIllustration src="/assets/home-rpsp-landscape-v1.webp" /></SettingsProvider>)
    expect(container.querySelector('img').getAttribute('src')).toBe('/assets/home-rpsp-landscape-v1.webp')
  })
})
