import { access, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_ICON_REVISION, SOCIAL_CARD_REVISION } from '../src/features/reader/socialCardConfig.js'

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
const availableVersions = versions.filter(({ available }) => available)
for (const version of availableVersions) {
  for (const book of books) {
    const aggregatePath = join(distDataDir, version.id, `${book.file}.json`)
    const aggregate = JSON.parse(await readFile(aggregatePath, 'utf8'))
    if (aggregate.version !== version.id || aggregate.book !== book.id || aggregate.name !== book.name) {
      throw new Error(`Invalid aggregated metadata for ${version.id} ${book.name}`)
    }
    if (!Array.isArray(aggregate.chapters) || aggregate.chapters.length !== book.chapters) {
      throw new Error(`Invalid chapter count for ${version.id} ${book.name}`)
    }

    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      const source = JSON.parse(await readFile(join(publicDataDir, version.id, book.file, `${chapter}.json`), 'utf8'))
      const deployed = aggregate.chapters[chapter - 1]
      if (deployed.chapter !== chapter || JSON.stringify(deployed.verses) !== JSON.stringify(source)) {
        throw new Error(`Aggregated chapter mismatch: ${version.id} ${book.name} ${chapter}`)
      }
      chapterCount += 1
    }
  }
}

for (const book of books) {
  for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
    await access(join(distDataDir, 'cba', String(book.id), `${chapter}.json`))
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
if (!indexHtml.includes(`https://www.santabiblia.cloud/og-share.jpg?v=${SOCIAL_CARD_REVISION}`)) {
  throw new Error('Static social metadata does not use the official direct image URL')
}
if (!indexHtml.includes(`/icons/favicon-32.png?v=${APP_ICON_REVISION}`) || !indexHtml.includes(`/icons/apple-touch-icon.png?v=${APP_ICON_REVISION}`)) {
  throw new Error('Static app icon metadata is out of sync with APP_ICON_REVISION')
}
if (indexHtml.includes('biblia-v2.vercel.app')) {
  throw new Error('Static social metadata still references the deprecated Vercel alias')
}

const manifest = JSON.parse(await readFile(join(root, 'dist', 'manifest.webmanifest'), 'utf8'))
if (!Array.isArray(manifest.icons) || manifest.icons.length !== 3 || manifest.icons.some(({ src }) => !src.endsWith(`?v=${APP_ICON_REVISION}`))) {
  throw new Error('Generated PWA manifest contains an out-of-date icon revision')
}

const socialImagePath = join(root, 'public', 'og-share.jpg')
const socialImage = await readFile(socialImagePath)
const socialImageStats = await stat(socialImagePath)
if (socialImage[0] !== 0xFF || socialImage[1] !== 0xD8 || socialImageStats.size >= 300_000) {
  throw new Error(`Invalid or oversized static social image (${socialImageStats.size} bytes)`)
}

const totalBooks = books.length * availableVersions.length
console.log(`Public data contract verified: ${totalBooks} aggregated books across ${availableVersions.map(({ id }) => id).join(', ')}, ${chapterCount} translation chapters and ${books.reduce((total, { chapters }) => total + chapters, 0)} CBA chapters.`)
