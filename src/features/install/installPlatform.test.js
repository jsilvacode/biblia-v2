import { describe, expect, it } from 'vitest'
import { detectInstallPlatform, isStandalone } from './installPlatform'

describe('install platform detection', () => {
  it('recognizes standard and iOS standalone launches', () => {
    expect(isStandalone({ displayModeStandalone: true, navigatorStandalone: false })).toBe(true)
    expect(isStandalone({ displayModeStandalone: false, navigatorStandalone: true })).toBe(true)
    expect(isStandalone({ displayModeStandalone: false, navigatorStandalone: false })).toBe(false)
  })

  it('recognizes iPhone and iPad desktop-mode browsers', () => {
    expect(detectInstallPlatform({ platform: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone)' })).toBe('ios')
    expect(detectInstallPlatform({ maxTouchPoints: 5, platform: 'MacIntel', userAgent: 'Mozilla/5.0' })).toBe('ios')
  })

  it('reserves Add to Dock guidance for Safari on macOS', () => {
    expect(detectInstallPlatform({ platform: 'MacIntel', userAgent: 'Mozilla/5.0 Safari/605.1.15' })).toBe('mac-safari')
    expect(detectInstallPlatform({ platform: 'MacIntel', userAgent: 'Mozilla/5.0 Chrome/124 Safari/537.36' })).toBe('other')
  })
})
