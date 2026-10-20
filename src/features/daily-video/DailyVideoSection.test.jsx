import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DailyVideoSection } from './DailyVideoSection'

const { useDailyVideoMock, shareMock } = vi.hoisted(() => ({
  useDailyVideoMock: vi.fn(),
  shareMock: vi.fn(),
}))

vi.mock('./useDailyVideo', () => ({ useDailyVideo: useDailyVideoMock }))
vi.mock('./shareDailyVideo.js', () => ({ shareDailyVideo: shareMock }))
vi.mock('../../i18n', () => ({
  useI18n: () => ({
    locale: 'es',
    t: (key, values = {}) => ({
      'dailyVideo.title': 'Este Día con Dios',
      'dailyVideo.play': `Reproducir: ${values.title}`,
      'dailyVideo.previous': 'Videos anteriores',
      'dailyVideo.share': 'Compartir cápsula',
      'dailyVideo.copied': 'Enlace copiado',
      'dailyVideo.pending': 'La cápsula aún no está disponible.',
      'dailyVideo.unavailable': 'No se pudo cargar la cápsula.',
      'dailyVideo.invalidDate': 'La fecha no es válida.',
      'dailyVideo.retry': 'Reintentar',
      'dailyVideo.officialSite': 'Sitio oficial',
      'dailyVideo.officialChannel': 'Canal oficial',
      'dailyVideo.watchOnYoutube': 'Ver en YouTube',
      'dailyVideo.viewToday': 'Ver cápsula de hoy',
      'dailyVideo.galleryPrevious': 'Ver videos anteriores',
      'dailyVideo.galleryNext': 'Ver más videos',
      'dailyVideo.galleryLabel': 'Cápsulas de los siete días anteriores',
      'dailyVideo.historyError': 'No pudimos cargar los videos anteriores.',
    }[key] ?? key),
  }),
}))

const episode = {
  contentDate: '2026-10-19',
  sourcePostId: 3202,
  title: 'No depende solo de nosotros',
  videoId: 'PbyYEJDJFwg',
  sourcePageUrl: 'https://estediacondios.com/2026/10/19/292-no-depende-solo-de-nosotros/',
  creator: 'Este Día con Dios',
  presenter: 'Pr. Jorge Rampogna',
  channelUrl: 'https://www.youtube.com/@EsteDiaConDios',
  language: 'es',
}

function readyState(overrides = {}) {
  return {
    date: episode.contentDate,
    episode,
    status: 'ready',
    retry: vi.fn(),
    loadPrevious: vi.fn(),
    previous: [],
    historyStatus: 'idle',
    ...overrides,
  }
}

function renderSection(props = {}) {
  return render(<MemoryRouter><DailyVideoSection {...props} /></MemoryRouter>)
}

let intersectionObservers

beforeEach(() => {
  useDailyVideoMock.mockReset()
  shareMock.mockReset()
  useDailyVideoMock.mockReturnValue(readyState())
  shareMock.mockResolvedValue('copied')
  intersectionObservers = []
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback, options) {
      this.callback = callback
      this.options = options
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      intersectionObservers.push(this)
    }
  })
})

afterEach(() => vi.unstubAllGlobals())

describe('daily video section', () => {
  it('loads the embedded player only on request and keeps a direct playback alternative', () => {
    const { container } = renderSection({ featured: true })

    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.getByRole('link', { name: 'Ver en YouTube' }).getAttribute('href')).toBe('https://www.youtube.com/watch?v=PbyYEJDJFwg')

    fireEvent.click(screen.getByRole('button', { name: `Reproducir: ${episode.title}` }))

    const player = screen.getByTitle(episode.title)
    expect(player.tagName).toBe('IFRAME')
    expect(player.getAttribute('src')).toContain('https://www.youtube-nocookie.com/embed/PbyYEJDJFwg?')
    // The player only exists after an explicit play gesture, so one click
    // starts playback without starting sound when the page is opened.
    expect(new URL(player.getAttribute('src')).searchParams.get('autoplay')).toBe('1')
    expect(new URL(player.getAttribute('src')).searchParams.get('controls')).toBe('1')
    expect(player.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin')
    expect(container.querySelectorAll('iframe')).toHaveLength(1)
    expect(useDailyVideoMock).toHaveBeenLastCalledWith({ date: undefined, freezeDate: true })
  })

  it('removes the previous player as soon as another date is requested', () => {
    const { container, rerender } = renderSection({ date: '2026-10-19' })
    fireEvent.click(screen.getByRole('button', { name: `Reproducir: ${episode.title}` }))
    expect(container.querySelector('iframe')).not.toBeNull()

    useDailyVideoMock.mockReturnValue(readyState({ date: '2026-10-18', status: 'loading', episode: null }))
    rerender(<MemoryRouter><DailyVideoSection date="2026-10-18" /></MemoryRouter>)

    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.queryByText(episode.title)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Compartir cápsula' })).toBeNull()
  })

  it('offers the new day without replacing a player until the reader requests it', () => {
    const { container, rerender } = renderSection({ featured: true })
    fireEvent.click(screen.getByRole('button', { name: `Reproducir: ${episode.title}` }))
    useDailyVideoMock.mockReturnValue(readyState({ newerDate: '2026-10-20' }))
    rerender(<MemoryRouter><DailyVideoSection featured /></MemoryRouter>)
    expect(container.querySelector('iframe').src).toContain(episode.videoId)
    fireEvent.click(screen.getByRole('button', { name: 'Ver cápsula de hoy' }))
    expect(useDailyVideoMock).toHaveBeenLastCalledWith({ date: undefined, freezeDate: false })
  })

  it('shares the displayed episode and reports the clipboard fallback', async () => {
    renderSection({ date: '2026-10-19' })
    fireEvent.click(screen.getByRole('button', { name: 'Compartir cápsula' }))

    await waitFor(() => expect(screen.getByText('Enlace copiado')).toBeTruthy())
    expect(shareMock).toHaveBeenCalledWith({ episode, locale: 'es', origin: window.location.origin })
  })

  it('does not show feedback from a share operation completed after changing dates', async () => {
    let resolveShare
    shareMock.mockImplementation(() => new Promise((resolve) => { resolveShare = resolve }))
    const { rerender } = renderSection({ date: '2026-10-19' })
    fireEvent.click(screen.getByRole('button', { name: 'Compartir cápsula' }))

    useDailyVideoMock.mockReturnValue(readyState({ date: '2026-10-18', episode: { ...episode, contentDate: '2026-10-18', videoId: 'mJmZNM0AHzA' } }))
    rerender(<MemoryRouter><DailyVideoSection date="2026-10-18" /></MemoryRouter>)
    await act(async () => resolveShare('copied'))

    expect(screen.queryByText('Enlace copiado')).toBeNull()
  })

  it('loads history near the viewport only once and shows thumbnail selection buttons', () => {
    const state = readyState()
    useDailyVideoMock.mockReturnValue(state)
    const { container, rerender } = renderSection()
    expect(state.loadPrevious).not.toHaveBeenCalled()

    const observer = intersectionObservers.at(-1)
    expect(observer.options.rootMargin).toBe('240px 0px')
    act(() => observer.callback([{ isIntersecting: false }]))
    expect(state.loadPrevious).not.toHaveBeenCalled()
    act(() => observer.callback([{ isIntersecting: true }]))
    expect(state.loadPrevious).toHaveBeenCalledOnce()

    useDailyVideoMock.mockReturnValue({ ...state, loadPrevious: vi.fn() })
    rerender(<MemoryRouter><DailyVideoSection /></MemoryRouter>)
    expect(useDailyVideoMock.mock.results.at(-1).value.loadPrevious).not.toHaveBeenCalled()

    useDailyVideoMock.mockReturnValue({
      ...state,
      historyStatus: 'ready',
      previous: [
        { contentDate: '2026-10-18', title: 'Separados para representar', sourcePostId: 3201, videoId: 'mJmZNM0AHzA' },
        { contentDate: '2026-10-17', title: 'Probando la Palabra', sourcePostId: 3210, videoId: null },
      ],
    })
    rerender(<MemoryRouter><DailyVideoSection /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /Separados para representar/ }).getAttribute('aria-pressed')).toBe('false')
    const gallery = screen.getByRole('region', { name: 'Cápsulas de los siete días anteriores' })
    expect(gallery.querySelectorAll('ol button')).toHaveLength(2)
    expect(gallery.querySelectorAll('img')).toHaveLength(1)
    expect(gallery.querySelector('img').getAttribute('src')).toBe('https://i.ytimg.com/vi/mJmZNM0AHzA/hqdefault.jpg')
    expect(gallery.querySelector('img').getAttribute('loading')).toBe('lazy')
    expect(screen.getByRole('button', { name: /Probando la Palabra/ }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.error(gallery.querySelector('img'))
    expect(gallery.querySelector('img')).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('selects a previous capsule in the main player, shares its date and can return to today', async () => {
    const previous = { ...episode, contentDate: '2026-10-18', title: 'Separados para representar', videoId: 'mJmZNM0AHzA', sourcePageUrl: 'https://estediacondios.com/2026/10/18/separados-para-representar/' }
    useDailyVideoMock.mockReturnValue(readyState({ historyStatus: 'ready', previous: [previous] }))
    const { container } = renderSection({ featured: true })
    fireEvent.click(screen.getByRole('button', { name: /18 de octubre de 2026.*Separados para representar/ }))
    expect(container.querySelectorAll('iframe')).toHaveLength(1)
    expect(container.querySelector('iframe').src).toContain('/embed/mJmZNM0AHzA?')
    expect(container.querySelector('iframe').src).toContain('playsinline=1')
    expect(screen.getByRole('heading', { name: previous.title })).toBeTruthy()
    expect(screen.getByRole('button', { name: /18 de octubre de 2026.*Separados para representar/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Compartir cápsula' }))
    await waitFor(() => expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({ episode: expect.objectContaining({ contentDate: '2026-10-18', videoId: previous.videoId }) })))
    fireEvent.click(screen.getByRole('button', { name: 'Ver cápsula de hoy' }))
    expect(screen.getByRole('heading', { name: episode.title })).toBeTruthy()
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('loads history once without IntersectionObserver support and allows retry after a failure', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const state = readyState()
    useDailyVideoMock.mockReturnValue(state)
    const { rerender } = renderSection()
    expect(state.loadPrevious).toHaveBeenCalledOnce()
    rerender(<MemoryRouter><DailyVideoSection /></MemoryRouter>)
    expect(state.loadPrevious).toHaveBeenCalledOnce()

    useDailyVideoMock.mockReturnValue({ ...state, historyStatus: 'error' })
    rerender(<MemoryRouter><DailyVideoSection /></MemoryRouter>)
    expect(screen.getByText('No pudimos cargar los videos anteriores.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(state.loadPrevious).toHaveBeenCalledTimes(2)
  })

  it('updates carousel boundary controls and respects reduced motion when scrolling', async () => {
    useDailyVideoMock.mockReturnValue(readyState({
      historyStatus: 'ready',
      previous: Array.from({ length: 7 }, (_, index) => ({ contentDate: `2026-10-${18 - index}`, title: `Cápsula ${index}`, videoId: null })),
    }))
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    renderSection()
    const gallery = screen.getByRole('region', { name: 'Cápsulas de los siete días anteriores' })
    const track = gallery.querySelector('ol')
    Object.defineProperties(track, { clientWidth: { value: 300 }, scrollWidth: { value: 1100 }, scrollLeft: { value: 0, writable: true } })
    track.scrollBy = vi.fn()
    fireEvent(window, new Event('resize'))
    const next = screen.getByRole('button', { name: 'Ver más videos' })
    const previous = screen.getByRole('button', { name: 'Ver videos anteriores' })
    await waitFor(() => expect(next.disabled).toBe(false))
    expect(previous.disabled).toBe(true)
    fireEvent.click(next)
    expect(track.scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'auto' })

    track.scrollLeft = 800
    fireEvent.scroll(track)
    expect(next.disabled).toBe(true)
    expect(previous.disabled).toBe(false)
    fireEvent.click(previous)
    expect(track.scrollBy).toHaveBeenLastCalledWith({ left: -240, behavior: 'auto' })
  })

  it('keeps the official source accessible when publication is pending and allows a retry', () => {
    const state = readyState({ status: 'pending', episode: null })
    useDailyVideoMock.mockReturnValue(state)
    renderSection()

    expect(screen.getByText('La cápsula aún no está disponible.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Sitio oficial' }).getAttribute('href')).toBe('https://estediacondios.com/')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(state.retry).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Compartir cápsula' })).toBeNull()
  })

  it('rejects mismatched ready data and invalid route dates without showing an unrelated video', () => {
    useDailyVideoMock.mockReturnValue(readyState({ date: '2026-10-18' }))
    const { container, rerender } = renderSection({ date: '2026-10-18' })
    expect(screen.getByText('No se pudo cargar la cápsula.')).toBeTruthy()
    expect(screen.queryByText(episode.title)).toBeNull()

    useDailyVideoMock.mockReturnValue(readyState({ date: null, episode: null, status: 'invalid_date' }))
    rerender(<MemoryRouter><DailyVideoSection date="2026-02-30" /></MemoryRouter>)
    expect(screen.getByText('La fecha no es válida.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull()
    expect(container.querySelector('iframe')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Cápsulas de los siete días anteriores' })).toBeNull()
  })
})
