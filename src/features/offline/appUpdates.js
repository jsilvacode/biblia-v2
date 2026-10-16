const UPDATE_INTERVAL_MS = 60 * 60 * 1000
const UPDATE_THROTTLE_MS = 5 * 60 * 1000
const ACTIVATION_TIMEOUT_MS = 10_000
const UPDATE_MESSAGE = 'SANTA_BIBLIA_UPDATE_AVAILABLE'

const initialState = Object.freeze({ available: false, applying: false, dismissed: false, error: false })

/** Updates may be discovered automatically; only a user action reloads a tab. */
export function createAppUpdater({
  window: browserWindow = globalThis.window,
  navigator: browserNavigator = globalThis.navigator,
  document: browserDocument = globalThis.document,
  reload = () => browserWindow.location.reload(),
} = {}) {
  const listeners = new Set()
  const cleanups = []
  let state = initialState
  let started = false
  let registration = null
  let registrationRequest = null
  let controller = null
  let announcedWorker = null
  let lastCheck = 0
  let interval = null
  let activationTimer = null
  let requestedReload = null
  let didReload = false

  function publish(patch) {
    state = Object.freeze({ ...state, ...patch })
    listeners.forEach(listener => listener())
  }

  function announce(worker) {
    if (requestedReload || worker && worker === announcedWorker && !state.error) return
    announcedWorker = worker
    publish({ available: true, applying: false, dismissed: false, error: false })
  }

  function inspectWaiting() {
    if (registration?.waiting) announce(registration.waiting)
  }

  function listen(target, name, listener) {
    target.addEventListener(name, listener)
    cleanups.push(() => target.removeEventListener(name, listener))
  }

  function finishRequest(success) {
    if (activationTimer !== null) browserWindow.clearTimeout(activationTimer)
    activationTimer = null
    const request = requestedReload
    requestedReload = null
    request?.resolve(success)
  }

  function failRequest() {
    finishRequest(false)
    publish({ available: true, applying: false, dismissed: false, error: true })
  }

  function reloadOnce() {
    if (didReload) return
    didReload = true
    try {
      reload()
      finishRequest(true)
    } catch {
      didReload = false
      failRequest()
    }
  }

  async function checkForUpdate(force = false) {
    if (!registration || browserNavigator.onLine === false) return
    const now = Date.now()
    if (!force && now - lastCheck < UPDATE_THROTTLE_MS) return
    lastCheck = now
    try {
      await registration.update()
    } catch {
      // A background check never interrupts reading or claims an update failed.
    }
    inspectWaiting()
  }

  function observeInstalling() {
    const installing = registration?.installing
    if (!installing) return
    const inspect = () => {
      if (installing.state === 'installed') {
        // registration.waiting is assigned as installation completes.
        browserWindow.setTimeout(inspectWaiting, 0)
      }
    }
    listen(installing, 'statechange', inspect)
    inspect()
  }

  function start() {
    if (started) return registrationRequest
    started = true
    const serviceWorker = browserNavigator?.serviceWorker
    if (!browserWindow || !serviceWorker?.register) {
      registrationRequest = Promise.resolve(null)
      return registrationRequest
    }
    controller = serviceWorker.controller

    listen(serviceWorker, 'controllerchange', () => {
      const previous = controller
      controller = serviceWorker.controller
      if (requestedReload) reloadOnce()
      else if (previous && controller !== previous) announce(controller)
    })
    listen(serviceWorker, 'message', (event) => {
      if (event.data?.type === UPDATE_MESSAGE) announce(event.source ?? serviceWorker.controller)
    })

    // Register immediately; third-party scripts must not delay update checks.
    registrationRequest = Promise.resolve()
      .then(() => serviceWorker.register('/sw.js', { updateViaCache: 'none' }))
      .then((nextRegistration) => {
        if (!started) return null
        registration = nextRegistration
        listen(registration, 'updatefound', observeInstalling)
        observeInstalling()
        inspectWaiting()
        void checkForUpdate(true)
        interval = browserWindow.setInterval(checkForUpdate, UPDATE_INTERVAL_MS)
        listen(browserWindow, 'focus', () => { void checkForUpdate() })
        listen(browserWindow, 'online', () => { void checkForUpdate() })
        listen(browserDocument, 'visibilitychange', () => {
          if (browserDocument.visibilityState === 'visible') void checkForUpdate()
        })
        return registration
      })
      .catch(() => null)
    return registrationRequest
  }

  function applyUpdate() {
    if (requestedReload) return requestedReload.promise
    if (didReload) return Promise.resolve(true)
    let resolve
    const promise = new Promise(done => { resolve = done })
    requestedReload = { promise, resolve }
    publish({ applying: true, dismissed: false, error: false })
    const waiting = registration?.waiting
    if (!waiting) {
      // The new worker may already control us after another tab updated.
      // A route failure can also request an ordinary, explicit document reload.
      reloadOnce()
    } else {
      activationTimer = browserWindow.setTimeout(failRequest, ACTIVATION_TIMEOUT_MS)
      try {
        waiting.postMessage({ type: 'SKIP_WAITING' })
      } catch {
        failRequest()
      }
    }
    return promise
  }

  return {
    start,
    applyUpdate,
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dismiss() { publish({ dismissed: true }) },
    stop() {
      started = false
      cleanups.splice(0).forEach(cleanup => cleanup())
      if (interval !== null) browserWindow.clearInterval(interval)
      interval = null
      finishRequest(false)
    },
  }
}

const appUpdater = createAppUpdater()

export function enableAutomaticAppUpdates() {
  return appUpdater.start()
}

export const getAppUpdateState = appUpdater.getSnapshot
export const subscribeAppUpdates = appUpdater.subscribe
export const dismissAppUpdate = appUpdater.dismiss
export const requestAppReload = appUpdater.applyUpdate
