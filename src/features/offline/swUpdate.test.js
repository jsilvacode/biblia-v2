import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const script = await readFile(resolve('public/sw-update.js'), 'utf8')

describe('service worker activation', () => {
  it('notifies existing tabs without navigating them or taking over their focus', async () => {
    const navigate = vi.fn()
    const postMessage = vi.fn()
    const foreignPost = vi.fn()
    const claim = vi.fn(async () => undefined)
    const matchAll = vi.fn(async () => [
      { url: 'https://bible.test/read/43/3', navigate, postMessage },
      { url: 'https://bible.test.evil/read/43/3', postMessage: foreignPost },
    ])
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
    expect(postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'SANTA_BIBLIA_UPDATE_AVAILABLE' })
    expect(navigate).not.toHaveBeenCalled()
    expect(claim).not.toHaveBeenCalled()
    expect(foreignPost).not.toHaveBeenCalled()
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
