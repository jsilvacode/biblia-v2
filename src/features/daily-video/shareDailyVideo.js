import { createVideoPath, isVideoId, normalizeVideoDate } from './dailyVideoModel.js'

export function createDailyVideoShareData({ episode, origin }) {
  if (!normalizeVideoDate(episode?.contentDate) || !isVideoId(episode?.videoId)) return null
  let base = 'https://www.santabiblia.cloud'
  try {
    const candidate = new URL(origin)
    if (['localhost', '127.0.0.1', '[::1]'].includes(candidate.hostname)) base = candidate.origin
  } catch { /* Use the public origin outside local development. */ }
  return {
    title: `${episode.title} · Este Día con Dios`,
    text: `${episode.title}\nEste Día con Dios${episode.presenter ? ` · ${episode.presenter}` : ''}`,
    url: new URL(createVideoPath(episode.contentDate), base).toString(),
  }
}

export async function shareDailyVideo(options) {
  const data = createDailyVideoShareData(options)
  if (!data) return 'unavailable'
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: data.title, text: data.url })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    if (!navigator.clipboard?.writeText) return 'unavailable'
    await navigator.clipboard.writeText(data.url)
    return 'copied'
  } catch {
    return 'unavailable'
  }
}
