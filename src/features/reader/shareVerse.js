const APP_SHARE_TEXT = 'Lee, medita y comparte la Biblia cada día.'
const OFFICIAL_APP_ORIGIN = 'https://www.santabiblia.cloud'
const SOCIAL_SHARE_REVISION = '7'

function getShareOrigin(origin) {
  try {
    const candidate = new URL(origin)
    const isLocal = candidate.hostname === 'localhost'
      || candidate.hostname === '127.0.0.1'
      || candidate.hostname === '[::1]'
    return isLocal ? candidate.origin : OFFICIAL_APP_ORIGIN
  } catch {
    return OFFICIAL_APP_ORIGIN
  }
}

export function createVerseShareUrl({
  book,
  chapter,
  locale = 'es',
  origin,
  verse,
  verseEnd = verse,
  versionId,
}) {
  const url = new URL(`/read/${Number(book)}/${Number(chapter)}/${Number(verse)}`, getShareOrigin(origin))
  url.searchParams.set('v', versionId)
  if (Number(verseEnd) > Number(verse)) url.searchParams.set('end', String(Number(verseEnd)))
  if (locale !== 'es') url.searchParams.set('lang', locale)
  url.searchParams.set('share', SOCIAL_SHARE_REVISION)
  return url.toString()
}

export function createAppShareData({ origin, text = APP_SHARE_TEXT }) {
  return {
    title: 'Santa Biblia',
    text,
    url: new URL('/', getShareOrigin(origin)).toString(),
  }
}

export function createVerseShareData({ reference, text, url, version }) {
  const citation = version ? `${reference} · ${version}` : reference
  return {
    title: citation,
    text: `${citation}\n\n${text}`,
    url,
  }
}

function createNativeSharePayload(data) {
  const payload = data.title ? { title: data.title } : {}

  // Una única URL nativa evita duplicados y permite que las aplicaciones de
  // mensajería la reconozcan como enlace para construir su vista previa.
  if (data.url) return { ...payload, url: data.url }
  if (data.text) return { ...payload, text: data.text }
  return payload
}

/**
 * Prefer the system share sheet. Clipboard is a deliberately local fallback:
 * it avoids pop-ups and still gives people a usable verse when Web Share is
 * unavailable (notably on many desktop browsers).
 */
export async function shareVerse(data) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(createNativeSharePayload(data))
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(`${data.text}\n\n${data.url}`)
      return 'copied'
    } catch {
      return 'unavailable'
    }
  }

  return 'unavailable'
}
