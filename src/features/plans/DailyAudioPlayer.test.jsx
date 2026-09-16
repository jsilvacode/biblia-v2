import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DailyAudioPlayer, formatAudioTime } from './DailyAudioPlayer'

const episode = {
  id: 'salmo-34',
  title: 'Salmo 34',
  publishedAt: '2026-09-10T04:00:00.000Z',
  presenter: null,
  language: 'es',
  sourcePageUrl: 'https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/salmo-34/',
  audioUrl: 'https://vod.nuevotiempo.org/ReavivadosA/Reavivados10-09-2026.mp3',
  mimeType: 'audio/mpeg',
  durationSeconds: null,
}

let playMock
let pauseMock
let loadMock

function mediaElement() {
  return document.querySelector('audio')
}

function setMediaTiming(audio, { currentTime = 0, duration = 0, paused = true } = {}) {
  Object.defineProperties(audio, {
    currentTime: { configurable: true, value: currentTime, writable: true },
    duration: { configurable: true, value: duration, writable: true },
    paused: { configurable: true, value: paused, writable: true },
  })
}

describe('DailyAudioPlayer', () => {
  beforeEach(() => {
    playMock = vi.fn(() => Promise.resolve())
    pauseMock = vi.fn()
    loadMock = vi.fn()
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(playMock)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pauseMock)
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(loadMock)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('formats only known elapsed times and keeps an unknown duration explicit', () => {
    expect(formatAudioTime(65)).toBe('1:05')
    expect(formatAudioTime(3_665)).toBe('1:01:05')
    expect(formatAudioTime(Number.NaN)).toBe('—:—')

    const { container } = render(<DailyAudioPlayer episode={episode} />)
    expect(container.querySelectorAll('audio')).toHaveLength(1)
    expect(mediaElement().getAttribute('preload')).toBe('none')
    expect(mediaElement().getAttribute('src')).toBeNull()
    expect(screen.getByText('—:—')).toBeTruthy()
  })

  it('keeps the play action honest until the browser emits playing', async () => {
    const { container } = render(<DailyAudioPlayer episode={episode} />)
    const audio = mediaElement()

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir reflexión' }))
    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1))

    expect(audio.src).toBe(episode.audioUrl)
    expect(container.querySelector('section').dataset.playbackState).toBe('loading')
    expect(screen.getByRole('button', { name: 'Reproducir reflexión' })).toBeTruthy()

    fireEvent(audio, new Event('playing'))
    expect(screen.getByRole('button', { name: 'Pausar reflexión' })).toBeTruthy()
  })

  it('updates the accessible timeline and seek controls from media events', () => {
    render(<DailyAudioPlayer episode={episode} />)
    const audio = mediaElement()
    setMediaTiming(audio, { currentTime: 20, duration: 120 })

    fireEvent(audio, new Event('loadedmetadata'))
    fireEvent(audio, new Event('timeupdate'))

    const timeline = screen.getByLabelText('Posición del audio')
    expect(timeline.getAttribute('aria-valuetext')).toBe('0:20 de 2:00')

    fireEvent.click(screen.getByRole('button', { name: 'Avanzar 15 segundos' }))
    expect(audio.currentTime).toBe(35)
    fireEvent(audio, new Event('seeked'))
    expect(screen.getByRole('button', { name: 'Reproducir reflexión' })).toBeTruthy()

    expect(screen.queryByRole('button', { name: /Velocidad de reproducción/i })).toBeNull()
  })

  it('reflects buffering, pause, seek and completion from the media element', () => {
    render(<DailyAudioPlayer episode={episode} />)
    const audio = mediaElement()
    setMediaTiming(audio, { currentTime: 30, duration: 90, paused: false })

    fireEvent(audio, new Event('playing'))
    expect(screen.getByRole('button', { name: 'Pausar reflexión' })).toBeTruthy()

    fireEvent(audio, new Event('waiting'))
    expect(screen.getByText('Cargando audio…')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pausar reflexión' })).toBeTruthy()

    fireEvent(audio, new Event('pause'))
    expect(screen.getByText('Reflexión en pausa.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reproducir reflexión' })).toBeTruthy()

    fireEvent(audio, new Event('seeking'))
    expect(screen.getByText('Buscando posición…')).toBeTruthy()

    fireEvent(audio, new Event('ended'))
    expect(screen.getByText('La reflexión ha terminado.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reproducir de nuevo' })).toBeTruthy()

    fireEvent(audio, new Event('error'))
    expect(screen.getByText('La fuente no permitió cargar el audio.')).toBeTruthy()
  })

  it('recovers from a rejected play request and from unavailable metadata', async () => {
    playMock.mockRejectedValueOnce(new Error('NotAllowedError'))
    const retry = vi.fn()
    const { unmount } = render(<DailyAudioPlayer episode={episode} onRetry={retry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir reflexión' }))
    await waitFor(() => expect(screen.getByText('La fuente no permitió cargar el audio.')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledTimes(1)

    unmount()
    render(<DailyAudioPlayer metadataStatus="unavailable" onRetry={retry} />)
    expect(screen.getByText('No pudimos cargar el audio. La lectura sigue disponible.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a intentar' }))
    expect(retry).toHaveBeenCalledTimes(2)
  })

  it('does not replace an active episode until the reader confirms the new day', async () => {
    const nextEpisode = {
      ...episode,
      id: 'salmo-35',
      sourcePageUrl: 'https://www.nuevotiempo.org/audio/reavivados-por-su-palabra-2/salmo-35/',
      audioUrl: 'https://vod.nuevotiempo.org/ReavivadosA/Reavivados11-09-2026.mp3',
    }
    const useAvailable = vi.fn()
    const { rerender } = render(<DailyAudioPlayer episode={episode} onUseAvailableEpisode={useAvailable} />)
    const audio = mediaElement()

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir reflexión' }))
    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1))
    fireEvent(audio, new Event('playing'))

    rerender(<DailyAudioPlayer episode={nextEpisode} onUseAvailableEpisode={useAvailable} />)
    expect(screen.getByText('Ya está disponible la lectura de hoy.')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Ver fuente/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a la lectura de hoy' }))
    expect(useAvailable).toHaveBeenCalledWith(nextEpisode)
    expect(audio.getAttribute('src')).toBeNull()
  })

  it('pauses and releases its one media source on unmount', async () => {
    const { unmount } = render(<DailyAudioPlayer episode={episode} />)
    const audio = mediaElement()

    fireEvent.click(screen.getByRole('button', { name: 'Reproducir reflexión' }))
    await waitFor(() => expect(audio.getAttribute('src')).not.toBeNull())
    unmount()

    expect(pauseMock).toHaveBeenCalled()
    expect(audio.getAttribute('src')).toBeNull()
  })
})
