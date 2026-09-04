import {
  createAppShareMetadata,
  getRequestOrigin,
  injectShareMetadata,
  loadVerseShareMetadata,
} from './_lib/shareMetadata.js'

export const config = { runtime: 'edge' }

async function loadIndexHtml(origin) {
  const response = await fetch(new URL('/index.html', origin), {
    headers: { accept: 'text/html', 'x-santa-biblia-share-render': '1' },
  })
  if (!response.ok) throw new Error(`No fue posible cargar index.html (${response.status}).`)
  return response.text()
}

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, {
      headers: { Allow: 'GET, HEAD' },
      status: 405,
    })
  }

  const origin = getRequestOrigin(request)
  const query = Object.fromEntries(new URL(request.url).searchParams.entries())
  const html = await loadIndexHtml(origin)
  let metadata = createAppShareMetadata(origin)

  if (query.type === 'verse') {
    try {
      metadata = await loadVerseShareMetadata({ origin, query })
    } catch {
      // An invalid or unavailable reference must not break a deep link. The SPA
      // still opens and applies its normal redirect while crawlers get a safe,
      // generic Santa Biblia preview.
    }
  }

  const document = injectShareMetadata(html, metadata)
  return new Response(request.method === 'HEAD' ? null : document, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Type': 'text/html; charset=utf-8',
      Vary: 'Host',
    },
    status: 200,
  })
}
