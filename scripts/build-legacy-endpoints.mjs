import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'public', 'data')
const outputDir = join(root, 'dist', 'data', 'rva2015')
const books = JSON.parse(await readFile(join(sourceDir, 'books.json'), 'utf8'))

await mkdir(outputDir, { recursive: true })

for (const book of books) {
  const chapters = []
  for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
    const verses = JSON.parse(await readFile(join(sourceDir, 'rva2015', book.file, `${chapter}.json`), 'utf8'))
    chapters.push({ chapter, verses })
  }

  const payload = {
    version: 'rva2015',
    book: book.id,
    name: book.name,
    chapters,
  }
  await writeFile(join(outputDir, `${book.file}.json`), JSON.stringify(payload))
}

console.log(`Legacy RVA2015 contract: ${books.length} aggregated books generated outside the PWA precache.`)
