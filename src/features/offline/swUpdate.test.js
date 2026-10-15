import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const script = await readFile(resolve('public/sw-update.js'), 'utf8')

describe('service worker activation', () => {
  it('claims tabs before reloading them without blocking activation on navigation', async () => {
    const navigate = vi.fn(() => new Promise(() => {}))
    const claim = vi.fn(async () => undefined)
    const matchAll = vi.fn(async () => [{ url: 'https://bible.test/read/43/3', navigate }])
    let activate
    runInNewContext(script, { self: {
      registration: { active: {} },
      location: { origin: 'https://bible.test' },
      clients: { claim, matchAll },
      addEventListener: (_, listener) => { activate = listener },
    } })
    let activation
    activate({ waitUntil: (promise) => { activation = promise } })
    await activation
    expect(claim.mock.invocationCallOrder[0]).toBeLessThan(matchAll.mock.invocationCallOrder[0])
    expect(navigate).toHaveBeenCalledWith('https://bible.test/read/43/3')
  })

  it('does not reload a first-time visitor', () => {
    const claim = vi.fn()
    let activate
    runInNewContext(script, { self: {
      registration: { active: null }, clients: { claim },
      addEventListener: (_, listener) => { activate = listener },
    } })
    const waitUntil = vi.fn()
    activate({ waitUntil })
    expect(waitUntil).not.toHaveBeenCalled()
    expect(claim).not.toHaveBeenCalled()
  })
})
