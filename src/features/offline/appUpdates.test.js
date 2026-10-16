import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppUpdater } from './appUpdates'

const updaters = []

function setup({ controlled = true, waiting = null } = {}) {
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: controlled ? {} : null,
    register: vi.fn(),
  })
  const registration = Object.assign(new EventTarget(), {
    active: serviceWorker.controller,
    installing: null,
    waiting,
    update: vi.fn().mockResolvedValue(undefined),
  })
  serviceWorker.register.mockResolvedValue(registration)
  const browserWindow = Object.assign(new EventTarget(), {
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: (...args) => clearTimeout(...args),
    setInterval: (...args) => setInterval(...args),
    clearInterval: (...args) => clearInterval(...args),
  })
  const browserDocument = Object.assign(new EventTarget(), { visibilityState: 'visible', readyState: 'loading' })
  const browserNavigator = { onLine: true, serviceWorker }
  const reload = vi.fn()
  const updater = createAppUpdater({ window: browserWindow, document: browserDocument, navigator: browserNavigator, reload })
  updaters.push(updater)
  return { updater, serviceWorker, registration, browserWindow, browserDocument, browserNavigator, reload }
}

function waitingWorker() {
  return Object.assign(new EventTarget(), { state: 'installed', postMessage: vi.fn() })
}

afterEach(() => {
  updaters.splice(0).forEach(updater => updater.stop())
  vi.useRealTimers()
})

describe('app update discovery and explicit application', () => {
  it('registers and checks immediately without waiting for document load or analytics', async () => {
    const { updater, serviceWorker, registration } = setup()
    await updater.start()
    expect(serviceWorker.register).toHaveBeenCalledExactlyOnceWith('/sw.js', { updateViaCache: 'none' })
    expect(registration.update).toHaveBeenCalledOnce()
    await updater.start()
    expect(serviceWorker.register).toHaveBeenCalledOnce()
  })

  it('announces an already waiting worker without activating or reloading it', async () => {
    const waiting = waitingWorker()
    const { updater, reload } = setup({ waiting })
    await updater.start()
    expect(updater.getSnapshot()).toMatchObject({ available: true, applying: false })
    expect(waiting.postMessage).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
    updater.dismiss()
    expect(updater.getSnapshot().dismissed).toBe(true)
    expect(reload).not.toHaveBeenCalled()
  })

  it('discovers a newly installed worker and retains dismissal for that version', async () => {
    vi.useFakeTimers()
    const { updater, registration, reload, browserWindow } = setup()
    await updater.start()
    const installing = waitingWorker()
    installing.state = 'installing'
    registration.installing = installing
    registration.dispatchEvent(new Event('updatefound'))
    installing.state = 'installed'
    registration.waiting = installing
    installing.dispatchEvent(new Event('statechange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(updater.getSnapshot().available).toBe(true)
    updater.dismiss()
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    browserWindow.dispatchEvent(new Event('focus'))
    await Promise.resolve()
    expect(updater.getSnapshot().dismissed).toBe(true)
    expect(reload).not.toHaveBeenCalled()
  })

  it('applies the requested worker and reloads only once after it controls this tab', async () => {
    const waiting = waitingWorker()
    const { updater, serviceWorker, registration, reload } = setup({ waiting })
    await updater.start()
    const applied = updater.applyUpdate()
    expect(updater.applyUpdate()).toBe(applied)
    expect(waiting.postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'SKIP_WAITING' })
    expect(reload).not.toHaveBeenCalled()
    serviceWorker.controller = waiting
    registration.waiting = null
    serviceWorker.dispatchEvent(new Event('controllerchange'))
    serviceWorker.dispatchEvent(new Event('controllerchange'))
    expect(await applied).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('announces activation from another tab and allows an explicit reload when no worker is waiting', async () => {
    const { updater, serviceWorker, reload } = setup()
    await updater.start()
    serviceWorker.controller = {}
    serviceWorker.dispatchEvent(new Event('controllerchange'))
    expect(updater.getSnapshot()).toMatchObject({ available: true, applying: false })
    expect(reload).not.toHaveBeenCalled()
    expect(await updater.applyUpdate()).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('also announces a worker activation message without reloading the receiving tab', async () => {
    const { updater, serviceWorker, reload } = setup()
    await updater.start()
    serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'SANTA_BIBLIA_UPDATE_AVAILABLE' } }))
    expect(updater.getSnapshot().available).toBe(true)
    expect(reload).not.toHaveBeenCalled()
  })

  it('does not show an update notice or reload for first installation', async () => {
    const { updater, serviceWorker, reload } = setup({ controlled: false })
    await updater.start()
    serviceWorker.controller = {}
    serviceWorker.dispatchEvent(new Event('controllerchange'))
    expect(updater.getSnapshot().available).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('exposes an activation failure, permits retry, and never reloads on a late unsolicited change', async () => {
    vi.useFakeTimers()
    const waiting = waitingWorker()
    const { updater, serviceWorker, registration, reload } = setup({ waiting })
    await updater.start()
    const applied = updater.applyUpdate()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(await applied).toBe(false)
    expect(updater.getSnapshot()).toMatchObject({ available: true, applying: false, error: true })
    expect(reload).not.toHaveBeenCalled()
    registration.waiting = null
    serviceWorker.controller = waiting
    serviceWorker.dispatchEvent(new Event('controllerchange'))
    expect(reload).not.toHaveBeenCalled()
    expect(updater.getSnapshot().error).toBe(false)
    expect(await updater.applyUpdate()).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('allows retry after postMessage throws instead of leaving the button permanently busy', async () => {
    const waiting = waitingWorker()
    waiting.postMessage.mockImplementationOnce(() => { throw new Error('Worker unavailable') })
    const { updater, serviceWorker, registration, reload } = setup({ waiting })
    await updater.start()
    expect(await updater.applyUpdate()).toBe(false)
    expect(updater.getSnapshot()).toMatchObject({ applying: false, error: true })
    const applied = updater.applyUpdate()
    serviceWorker.controller = waiting
    registration.waiting = null
    serviceWorker.dispatchEvent(new Event('controllerchange'))
    expect(await applied).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('throttles focus/visibility checks, skips offline checks, and cleans up listeners', async () => {
    vi.useFakeTimers()
    const { updater, registration, browserWindow, browserDocument, browserNavigator } = setup()
    await updater.start()
    browserWindow.dispatchEvent(new Event('focus'))
    browserDocument.dispatchEvent(new Event('visibilitychange'))
    expect(registration.update).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    browserNavigator.onLine = false
    browserWindow.dispatchEvent(new Event('focus'))
    expect(registration.update).toHaveBeenCalledOnce()
    browserNavigator.onLine = true
    browserWindow.dispatchEvent(new Event('online'))
    expect(registration.update).toHaveBeenCalledTimes(2)
    updater.stop()
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000)
    browserWindow.dispatchEvent(new Event('focus'))
    expect(registration.update).toHaveBeenCalledTimes(2)
  })

  it('keeps reading usable when registration fails and allows an explicit ordinary reload', async () => {
    const { updater, serviceWorker, reload } = setup()
    serviceWorker.register.mockRejectedValue(new Error('Offline'))
    await expect(updater.start()).resolves.toBeNull()
    expect(updater.getSnapshot().available).toBe(false)
    expect(await updater.applyUpdate()).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })
})
