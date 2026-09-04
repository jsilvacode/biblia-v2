import { LocaleProvider } from '../i18n'
import { InstallProvider } from '../features/install/InstallProvider'
import { ReadingProvider } from '../features/reading/ReadingProvider'
import { SavedProvider } from '../features/saved/SavedProvider'
import { SettingsProvider } from '../features/settings/SettingsProvider'

export function AppProviders({ children }) {
  return (
    <SettingsProvider>
      <InstallProvider>
        <LocaleProvider>
          <ReadingProvider>
            <SavedProvider>{children}</SavedProvider>
          </ReadingProvider>
        </LocaleProvider>
      </InstallProvider>
    </SettingsProvider>
  )
}
