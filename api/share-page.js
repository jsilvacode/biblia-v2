import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadLocalChapter } from './_lib/shareCorpus.js'
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
  let cacheable = true

  if (query.type === 'verse') {
    try {
      metadata = await loadVerseShareMetadata({ origin, query, loadChapter: loadLocalChapter })
    } catch {
      cacheable = false
      // El lector sigue disponible si una referencia falla, sin almacenar
      // una vista previa genérica que oculte después el versículo correcto.
    }
  }

  const document = injectShareMetadata(html, metadata)
  return new Response(request.method === 'HEAD' ? null : document, {
    headers: {
      'Cache-Control': cacheable ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
      Vary: 'Host',
    },
    status: 200,
  })
}

export default { fetch: handler }
