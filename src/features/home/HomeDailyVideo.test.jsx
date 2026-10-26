import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomeDailyVideo } from './HomeDailyVideo'

const { renderVideo } = vi.hoisted(() => ({ renderVideo: vi.fn() }))
vi.mock('../daily-video/DailyVideoSection', () => ({ DailyVideoSection: renderVideo }))
vi.mock('../../i18n', () => ({ useI18n: () => ({ t: (key) => key }) }))

let observers
beforeEach(() => {
  renderVideo.mockReset().mockImplementation(() => <section data-testid="daily-video" />)
  observers = []
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback, options) {
      this.callback = callback
      this.options = options
      this.observe = vi.fn()
      this.disconnect = vi.fn()
      observers.push(this)
    }
  })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('home video loading', () => {
  it('does not mount its requests and timers until the section approaches the viewport', async () => {
    render(<HomeDailyVideo />)
    expect(renderVideo).not.toHaveBeenCalled()
    const directLink = screen.getByRole('link', { name: 'dailyVideo.viewToday' })
    expect(directLink.getAttribute('href')).toBe('/este-dia-con-dios')
    directLink.focus()
    expect(observers[0].options.rootMargin).toBe('128px 0px')
    act(() => observers[0].callback([{ isIntersecting: false }]))
    expect(renderVideo).not.toHaveBeenCalled()

    act(() => observers[0].callback([{ isIntersecting: true }]))
    await screen.findByTestId('daily-video')
    expect(document.activeElement).toBe(directLink)
    expect(renderVideo.mock.calls.at(-1)[0].featured).toBe(true)
    expect(observers[0].disconnect).toHaveBeenCalled()

    act(() => observers[0].callback([{ isIntersecting: false }]))
    expect(screen.getByTestId('daily-video')).toBeTruthy()
  })

  it('releases the observer if the reader leaves before reaching the section', () => {
    const view = render(<HomeDailyVideo />)
    view.unmount()
    expect(observers[0].disconnect).toHaveBeenCalled()
    expect(renderVideo).not.toHaveBeenCalled()
  })

  it('loads normally when viewport observation is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<HomeDailyVideo />)
    await screen.findByTestId('daily-video')
  })
})
