import { afterEach, describe, expect, it, vi } from 'vitest'

describe('bible repository', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('shares one network request between concurrent chapter loads', async () => {
    const verses = [{ verse: 1, text: 'En el principio.' }]
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(verses), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { loadChapter } = await import('./bibleRepository')
    const [first, second] = await Promise.all([
      loadChapter({ versionId: 'test-concurrent', bookId: 1, chapter: 1 }),
      loadChapter({ versionId: 'test-concurrent', bookId: 1, chapter: 1 }),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(first).toEqual(verses)
    expect(second).toBe(first)
  })

  it('keeps a shared preload alive when one consumer aborts', async () => {
    let finishRequest
    const fetchMock = vi.fn(() => new Promise((resolve) => {
      finishRequest = () => resolve(new Response(JSON.stringify([{ verse: 1, text: 'Texto.' }]), { status: 200 }))
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { loadChapter } = await import('./bibleRepository')
    const controller = new AbortController()
    const abortedLoad = loadChapter({ versionId: 'test-abort', bookId: 1, chapter: 1, signal: controller.signal })
    const activeLoad = loadChapter({ versionId: 'test-abort', bookId: 1, chapter: 1 })
    controller.abort()
    finishRequest()

    await expect(abortedLoad).rejects.toMatchObject({ name: 'AbortError' })
    await expect(activeLoad).resolves.toEqual([{ verse: 1, text: 'Texto.' }])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('normalizes scripture text and headings at the repository boundary', async () => {
    const verses = [{ verse: 1, text: '¶El Padre queme envió    .', heading: '  El testimonio  ' }]
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(verses), { status: 200 })))

    const { loadChapter } = await import('./bibleRepository')

    await expect(loadChapter({ versionId: 'test-normalize', bookId: 1, chapter: 1 }))
      .resolves.toEqual([{ verse: 1, text: 'El Padre que me envió.', heading: 'El testimonio' }])
  })

  it('normalizes commentary text recursively', async () => {
    const commentary = { 1: { b: [['p', 'k\u008Dtos como como  .']] } }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(commentary), { status: 200 })))

    const { loadCommentary } = await import('./bibleRepository')

    await expect(loadCommentary({ bookId: 1, chapter: 1 }))
      .resolves.toEqual({ 1: { b: [['p', 'kētos como.']] } })
  })

  it('caches normalized commentary and shares concurrent requests', async () => {
    const commentary = { 1: { b: [['p', 'Texto del comentario.']] } }
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(commentary), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { loadCommentary } = await import('./bibleRepository')
    const [first, second] = await Promise.all([
      loadCommentary({ bookId: 43, chapter: 3 }),
      loadCommentary({ bookId: 43, chapter: 3 }),
    ])
    const third = await loadCommentary({ bookId: 43, chapter: 3 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
    expect(third).toBe(first)
  })

  it('does not cancel shared commentary when one consumer aborts', async () => {
    let finishRequest
    const fetchMock = vi.fn(() => new Promise((resolve) => {
      finishRequest = () => resolve(new Response(JSON.stringify({ 1: 'Texto.' }), { status: 200 }))
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { loadCommentary } = await import('./bibleRepository')
    const controller = new AbortController()
    const abortedLoad = loadCommentary({ bookId: 19, chapter: 119, signal: controller.signal })
    const activeLoad = loadCommentary({ bookId: 19, chapter: 119 })
    controller.abort()
    finishRequest()

    await expect(abortedLoad).rejects.toMatchObject({ name: 'AbortError' })
    await expect(activeLoad).resolves.toEqual({ 1: 'Texto.' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
