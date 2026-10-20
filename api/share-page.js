import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadLocalChapter } from './_lib/shareCorpus.js'
import {
  createDailyVideoFallbackMetadata,
  loadDailyVideoShareMetadata,
} from './_lib/dailyVideoShare.js'
import {
  createAppShareMetadata,
  getRequestOrigin,
  injectShareMetadata,
  loadVerseShareMetadata,
} from './_lib/shareMetadata.js'

async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, {
      headers: { Allow: 'GET, HEAD' },
      status: 405,
    })
  }

  const origin = getRequestOrigin(request)
  const query = Object.fromEntries(new URL(request.url).searchParams.entries())
  const html = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  let metadata = createAppShareMetadata(origin)
  let cacheControl = 'public, s-maxage=86400, stale-while-revalidate=604800'

  if (query.type === 'verse') {
    try {
      metadata = await loadVerseShareMetadata({ origin, query, loadChapter: loadLocalChapter })
    } catch {
      cacheControl = 'no-store'
      // El lector sigue disponible si una referencia falla, sin almacenar
      // una vista previa genérica que oculte después el versículo correcto.
    }
  } else if (query.type === 'daily-video') {
    metadata = createDailyVideoFallbackMetadata({ origin, date: query.date })
    cacheControl = 'no-store'
    try {
      metadata = await loadDailyVideoShareMetadata({ origin, date: query.date })
      cacheControl = 'public, s-maxage=900, stale-while-revalidate=3600'
    } catch {
      // La URL por fecha conserva la SPA y su identidad aunque el origen esté
      // caído. No guardar una vista previa genérica de una ausencia temporal.
    }
  }

  const document = injectShareMetadata(html, metadata)
  return new Response(request.method === 'HEAD' ? null : document, {
    headers: {
      'Cache-Control': cacheControl,
      'Content-Type': 'text/html; charset=utf-8',
      Vary: 'Host',
    },
    status: 200,
  })
}

export default { fetch: handler }
