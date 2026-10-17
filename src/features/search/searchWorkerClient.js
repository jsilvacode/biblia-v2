export const SEARCH_WORKER_IDLE_MS = 2 * 60 * 1000
const REQUEST_TIMEOUT_MS = 20_000

function abortError() {
  return new DOMException('The search was cancelled', 'AbortError')
}

/** One worker per tab; each request owns its response and cancellation. */
export function createSearchWorkerClient({
  createWorker = () => new Worker(new URL('../../workers/searchWorker.js', import.meta.url), { type: 'module' }),
  setTimeout: schedule = (...args) => globalThis.setTimeout(...args),
  clearTimeout: cancel = (...args) => globalThis.clearTimeout(...args),
  idleMs = SEARCH_WORKER_IDLE_MS,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const pending = new Map()
  let worker = null
  let requestId = 0
  let idleTimer = null

  function clearIdle() {
    if (idleTimer !== null) cancel(idleTimer)
    idleTimer = null
  }

  function stopWorker() {
    clearIdle()
    const previous = worker
    worker = null
    if (!previous) return
    previous.onmessage = null
    previous.onerror = null
    previous.onmessageerror = null
    previous.terminate()
  }

  function scheduleIdle() {
    if (pending.size || !worker) return
    clearIdle()
    idleTimer = schedule(stopWorker, idleMs)
  }

  function settle(id, error, response) {
    const request = pending.get(id)
    if (!request) return
    pending.delete(id)
    cancel(request.timeout)
    request.signal?.removeEventListener('abort', request.onAbort)
    if (error) request.reject(error)
    else request.resolve(response)
    scheduleIdle()
  }

  function failWorker(error) {
    stopWorker()
    for (const id of pending.keys()) settle(id, error)
  }

  function ensureWorker() {
    if (worker) return worker
    const created = createWorker()
    worker = created
    created.onmessage = (event) => {
      if (created !== worker) return
      const response = event.data
      const request = pending.get(response?.id)
      if (!request) return
      if (response.key !== request.key || response.translationId !== request.translationId || response.append !== request.append) {
        settle(response.id, new Error('The search response did not match its request'))
      } else if (response.status === 'error') {
        settle(response.id, new Error(response.message || 'The search could not be completed'))
      } else if (response.status !== 'ready') {
        settle(response.id, new Error('The search response was invalid'))
      } else {
        settle(response.id, null, response)
      }
    }
    created.onerror = (event) => {
      if (created !== worker) return
      event.preventDefault?.()
      failWorker(new Error(event.message || 'The search worker could not be loaded'))
    }
    created.onmessageerror = () => {
      if (created === worker) failWorker(new Error('The search response could not be read'))
    }
    return created
  }

  function request(payload, { signal } = {}) {
    if (signal?.aborted) return Promise.reject(abortError())
    clearIdle()
    const id = ++requestId

    return new Promise((resolve, reject) => {
      let activeWorker
      try {
        activeWorker = ensureWorker()
      } catch (error) {
        reject(error)
        return
      }
      const onAbort = () => settle(id, abortError())
      const timeout = schedule(() => {
        settle(id, new Error('The search timed out. Please try again.'))
        // A silent worker must be recreatable; never terminate it while
        // another caller still has a live request.
        if (!pending.size) stopWorker()
      }, requestTimeoutMs)
      const append = payload.append ?? false
      pending.set(id, { resolve, reject, signal, onAbort, timeout, key: payload.key, translationId: payload.translationId, append })
      signal?.addEventListener('abort', onAbort, { once: true })
      if (signal?.aborted) { onAbort(); return }
      try {
        activeWorker.postMessage({ ...payload, append, id })
      } catch (error) {
        failWorker(error)
      }
    })
  }

  return {
    request,
    dispose() { failWorker(abortError()) },
  }
}

export const searchWorkerClient = createSearchWorkerClient()
