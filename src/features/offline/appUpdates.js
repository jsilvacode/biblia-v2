const UPDATE_INTERVAL_MS = 60 * 60 * 1000
const UPDATE_THROTTLE_MS = 5 * 60 * 1000

export function enableAutomaticAppUpdates() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  let lastCheck = 0

  async function configureChecks() {
    try {
      const registration = await navigator.serviceWorker.ready

      async function checkForUpdate(force = false) {
        const now = Date.now()
        if (!force && now - lastCheck < UPDATE_THROTTLE_MS) return
        if (navigator.onLine === false) return

        lastCheck = now
        try {
          await registration.update()
        } catch {
          // La falta temporal de red no debe interrumpir la lectura.
        }
      }

      await checkForUpdate(true)
      window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS)
      window.addEventListener('focus', () => checkForUpdate())
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate()
      })
    } catch {
      // La aplicación continúa funcionando aunque el navegador rechace el registro.
    }
  }

  if (document.readyState === 'complete') {
    configureChecks()
  } else {
    window.addEventListener('load', configureChecks, { once: true })
  }
}
