import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSettings } from '../features/settings/SettingsProvider'
import es from './locales/es'

const localeLoaders = {
  es: async () => es,
  en: async () => (await import('./locales/en')).default,
  'pt-BR': async () => (await import('./locales/pt-BR')).default,
}
const LocaleContext = createContext(null)

function readPath(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object)
}

function interpolate(text, values) {
  return String(text).replace(/{{(\w+)}}/g, (_, key) => values[key] ?? `{{${key}}}`)
}

export function LocaleProvider({ children }) {
  const { settings } = useSettings()
  const locale = localeLoaders[settings.locale] ? settings.locale : 'es'
  const [dictionary, setDictionary] = useState(es)
  const [loadedLocale, setLoadedLocale] = useState('es')

  useEffect(() => {
    let active = true
    localeLoaders[locale]().then((nextDictionary) => {
      if (active) {
        setDictionary(nextDictionary)
        setLoadedLocale(locale)
      }
    })
    return () => { active = false }
  }, [locale])

  const activeDictionary = loadedLocale === locale ? dictionary : es

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = activeDictionary.app.name
  }, [activeDictionary, locale])

  const value = useMemo(() => ({
    locale,
    t(path, values = {}) {
      const text = readPath(activeDictionary, path) ?? readPath(es, path) ?? path
      return interpolate(text, values)
    },
  }), [activeDictionary, locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useI18n must be used inside LocaleProvider')
  return context
}
