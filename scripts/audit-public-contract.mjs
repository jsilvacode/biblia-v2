import { access, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDataDir = join(root, 'public', 'data')
const distDataDir = join(root, 'dist', 'data')
const books = JSON.parse(await readFile(join(publicDataDir, 'books.json'), 'utf8'))
const versions = JSON.parse(await readFile(join(publicDataDir, 'versions.json'), 'utf8'))
const deployedBooks = JSON.parse(await readFile(join(distDataDir, 'books.json'), 'utf8'))
const sourceBooks = JSON.parse(await readFile(join(root, 'src', 'features', 'bible', 'data', 'books.json'), 'utf8'))
const sourceVersions = JSON.parse(await readFile(join(root, 'src', 'features', 'bible', 'data', 'versions.json'), 'utf8'))

if (books.length !== 66 || deployedBooks.length !== books.length) {
  throw new Error(`Invalid book catalog: expected 66 books, found ${deployedBooks.length}`)
}
if (JSON.stringify(books) !== JSON.stringify(sourceBooks) || JSON.stringify(versions) !== JSON.stringify(sourceVersions)) {
  throw new Error('Public and application Bible catalogs have drifted apart')
}

let chapterCount = 0
for (const book of books) {
  const aggregatePath = join(distDataDir, 'rva2015', `${book.file}.json`)
  const aggregate = JSON.parse(await readFile(aggregatePath, 'utf8'))
  if (aggregate.version !== 'rva2015' || aggregate.book !== book.id || aggregate.name !== book.name) {
    throw new Error(`Invalid aggregated metadata for ${book.name}`)
  }
  if (!Array.isArray(aggregate.chapters) || aggregate.chapters.length !== book.chapters) {
    throw new Error(`Invalid chapter count for ${book.name}`)
  }

  for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
    const source = JSON.parse(await readFile(join(publicDataDir, 'rva2015', book.file, `${chapter}.json`), 'utf8'))
    const deployed = aggregate.chapters[chapter - 1]
    if (deployed.chapter !== chapter || JSON.stringify(deployed.verses) !== JSON.stringify(source)) {
      throw new Error(`Aggregated chapter mismatch: ${book.name} ${chapter}`)
    }
    await access(join(distDataDir, 'cba', String(book.id), `${chapter}.json`))
    chapterCount += 1
  }
}

const vercel = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'))
const hasSpaFallback = vercel.rewrites?.some(({ destination }) => destination === '/index.html')
const dataRule = vercel.headers?.find(({ source }) => source.startsWith('/data/'))
const allowsCrossOrigin = dataRule?.headers?.some(({ key, value }) => key.toLowerCase() === 'access-control-allow-origin' && value === '*')
const trailingReaderRedirect = vercel.redirects?.some(({ source, destination }) => (
  source === '/read/:book/:chapter/:verse/' && destination === '/read/:book/:chapter/:verse'
))

if (!hasSpaFallback) throw new Error('Missing SPA fallback in vercel.json')
if (!allowsCrossOrigin) throw new Error('Missing public CORS policy for /data endpoints')
if (!trailingReaderRedirect) throw new Error('Missing canonical redirect for reader URLs with a trailing slash')

const indexHtml = await readFile(join(root, 'index.html'), 'utf8')
if (!indexHtml.includes('https://www.santabiblia.cloud/og-share.jpg?v=9')) {
  throw new Error('Static social metadata does not use the official direct image URL')
}
if (indexHtml.includes('biblia-v2.vercel.app')) {
  throw new Error('Static social metadata still references the deprecated Vercel alias')
}

const socialImagePath = join(root, 'public', 'og-share.jpg')
const socialImage = await readFile(socialImagePath)
const socialImageStats = await stat(socialImagePath)
if (socialImage[0] !== 0xFF || socialImage[1] !== 0xD8 || socialImageStats.size >= 300_000) {
  throw new Error(`Invalid or oversized static social image (${socialImageStats.size} bytes)`)
}

console.log(`Public data contract verified: ${books.length} books, ${chapterCount} RVA2015 chapters and ${chapterCount} CBA chapters.`)
