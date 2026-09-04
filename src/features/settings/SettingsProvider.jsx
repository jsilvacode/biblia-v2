import { bibleVersions } from '../bible/catalog'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { normalizeReaderFontScale } from './readerFontScale'

const STORAGE_KEY = 'santa_biblia_v2_settings'

const defaultSettings = {
  bibleVersion: 'nbla',
  fontFamily: 'serif',
  locale: 'es',
  readerFontScale: 1,
  readerLineHeight: 'comfortable',
  theme: 'system',
}

const allowedValues = {
  bibleVersion: new Set(bibleVersions.map((version) => version.id)),
  fontFamily: new Set(['serif', 'sans']),
  locale: new Set(['es', 'en', 'pt-BR']),
  readerLineHeight: new Set(['compact', 'comfortable', 'spacious']),
  theme: new Set(['system', 'light', 'dark']),
}

const SettingsContext = createContext(null)

function normalizeSetting(name, value) {
  if (name === 'readerFontScale') return normalizeReaderFontScale(value)
  return allowedValues[name]?.has(value) ? value : defaultSettings[name]
}

function normalizeSettings(value) {
  const stored = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return Object.fromEntries(
    Object.keys(defaultSettings).map((name) => [name, normalizeSetting(name, stored[name])]),
  )
}

function readSettings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? normalizeSettings(JSON.parse(stored)) : { ...defaultSettings }
  } catch {
    return { ...defaultSettings }
  }
}

function getSystemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function getResolvedTheme(theme, prefersDark = getSystemPrefersDark()) {
  if (theme !== 'system') return theme
  return prefersDark ? 'dark' : 'light'
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(readSettings)
  const [prefersDark, setPrefersDark] = useState(getSystemPrefersDark)
  const resolvedTheme = getResolvedTheme(settings.theme, prefersDark)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return undefined

    const handleChange = (event) => setPrefersDark(event.matches)

    if (media.addEventListener) {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }

    media.addListener?.(handleChange)
    return () => media.removeListener?.(handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.setProperty('--reader-scale', settings.readerFontScale)
    const themeColor = window.getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-app')
      .trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      themeColor,
    )
  }, [resolvedTheme, settings.readerFontScale])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Private browsing or a full storage quota must not make the reader unusable.
    }
  }, [settings])

  const value = useMemo(() => ({
    settings,
    resolvedTheme,
    updateSetting(name, nextValue) {
      if (!(name in defaultSettings)) return
      setSettings((current) => ({
        ...current,
        [name]: normalizeSetting(name, nextValue),
      }))
    },
    toggleTheme() {
      setSettings((current) => ({
        ...current,
        theme: getResolvedTheme(current.theme) === 'dark' ? 'light' : 'dark',
      }))
    },
    resetSettings() {
      setSettings({ ...defaultSettings })
    },
  }), [resolvedTheme, settings])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}
