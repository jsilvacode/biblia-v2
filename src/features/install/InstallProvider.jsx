import { createContext, useContext, useEffect, useState } from 'react'
import { detectInstallPlatform, isStandalone } from './installPlatform'

export const INSTALL_INVITATION_DISMISSED_KEY = 'santa_biblia_v2_install_invitation_dismissed_at'
export const INSTALL_INVITATION_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

const InstallContext = createContext(null)

function readDismissedAt() {
  try {
    const value = Number(window.localStorage.getItem(INSTALL_INVITATION_DISMISSED_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function isWithinCooldown(dismissedAt, now = Date.now()) {
  if (!dismissedAt) return false
  return now - dismissedAt < INSTALL_INVITATION_COOLDOWN_MS
}

export function InstallProvider({ children }) {
  const [installed, setInstalled] = useState(isStandalone)
  const [promptEvent, setPromptEvent] = useState(null)
  const [dismissedAt, setDismissedAt] = useState(readDismissedAt)
  const [isRequesting, setIsRequesting] = useState(false)
  const platform = detectInstallPlatform()

  useEffect(() => {
    const displayMode = window.matchMedia?.('(display-mode: standalone)')

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      if (!isStandalone()) setPromptEvent(event)
    }

    function handleInstalled() {
      setInstalled(true)
      setPromptEvent(null)
      setDismissedAt(null)
      try {
        window.localStorage.removeItem(INSTALL_INVITATION_DISMISSED_KEY)
      } catch {
        // Installation state still works when storage is unavailable.
      }
    }

    function handleDisplayModeChange() {
      if (isStandalone()) handleInstalled()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    displayMode?.addEventListener?.('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      displayMode?.removeEventListener?.('change', handleDisplayModeChange)
    }
  }, [])

  function dismissFirstOffer() {
    const nextDismissedAt = Date.now()
    setDismissedAt(nextDismissedAt)
    try {
      window.localStorage.setItem(INSTALL_INVITATION_DISMISSED_KEY, String(nextDismissedAt))
    } catch {
      // The in-memory cooldown still prevents repeated prompts this session.
    }
  }

  async function requestInstall() {
    if (installed) return 'installed'
    if (!promptEvent) return platform === 'ios' || platform === 'mac-safari' ? 'guidance' : 'unavailable'

    const currentPrompt = promptEvent
    setIsRequesting(true)
    try {
      await currentPrompt.prompt()
      const choice = await currentPrompt.userChoice
      const outcome = choice?.outcome === 'accepted' ? 'accepted' : 'dismissed'
      setPromptEvent(null)
      if (outcome === 'dismissed') dismissFirstOffer()
      return outcome
    } catch {
      setPromptEvent(null)
      return 'unavailable'
    } finally {
      setIsRequesting(false)
    }
  }

  const status = installed
    ? 'installed'
    : promptEvent
      ? 'promptable'
      : platform === 'ios' || platform === 'mac-safari'
        ? 'guidance'
        : 'unavailable'
  const shouldOffer = !installed
    && !isWithinCooldown(dismissedAt)
    && (Boolean(promptEvent) || status === 'guidance')

  const value = {
    dismissFirstOffer,
    installed,
    isRequesting,
    platform,
    requestInstall,
    shouldOffer,
    status,
  }

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
}

export function useInstall() {
  const context = useContext(InstallContext)
  if (!context) throw new Error('useInstall must be used inside InstallProvider')
  return context
}
