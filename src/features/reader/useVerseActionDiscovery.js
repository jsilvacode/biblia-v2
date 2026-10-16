import { useState } from 'react'

const storageKey = 'santa_biblia_v2_verse_actions_discovered'

export function useVerseActionDiscovery() {
  const [isDiscovered, setDiscovered] = useState(() => {
    try { return window.localStorage.getItem(storageKey) === 'true' } catch { return false }
  })
  function dismissHint() {
    setDiscovered(true)
    try { window.localStorage.setItem(storageKey, 'true') } catch { /* Reading remains available without storage. */ }
  }
  return { isDiscovered, dismissHint }
}
