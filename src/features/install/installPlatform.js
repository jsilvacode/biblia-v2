const IOS_PATTERN = /iPad|iPhone|iPod/i
const SAFARI_PATTERN = /Safari/i
const OTHER_WEBKIT_BROWSER_PATTERN = /Chrome|Chromium|CriOS|Edg|EdgiOS|FxiOS|OPR|OPiOS/i

export function isStandalone({
  displayModeStandalone = typeof window !== 'undefined'
    && Boolean(window.matchMedia?.('(display-mode: standalone)').matches),
  navigatorStandalone = typeof navigator !== 'undefined' && navigator.standalone === true,
} = {}) {
  return Boolean(displayModeStandalone || navigatorStandalone)
}

export function detectInstallPlatform({
  maxTouchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
  platform = typeof navigator !== 'undefined' ? navigator.platform : '',
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
} = {}) {
  const ipadDesktopMode = platform === 'MacIntel' && maxTouchPoints > 1
  if (IOS_PATTERN.test(userAgent) || ipadDesktopMode) return 'ios'

  const isSafari = SAFARI_PATTERN.test(userAgent) && !OTHER_WEBKIT_BROWSER_PATTERN.test(userAgent)
  if (isSafari && /^Mac/i.test(platform)) return 'mac-safari'

  return 'other'
}
