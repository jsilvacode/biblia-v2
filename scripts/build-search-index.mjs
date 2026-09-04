import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeScriptureText } from '../src/features/bible/textNormalizer.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'public', 'data')
const versions = JSON.parse(await readFile(join(dataDir, 'versions.json'), 'utf8'))
const books = JSON.parse(await readFile(join(dataDir, 'books.json'), 'utf8'))
const outputDir = join(dataDir, 'search')

await mkdir(outputDir, { recursive: true })

for (const version of versions) {
  const entries = []

  for (const book of books) {
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      const sourcePath = join(dataDir, version.id, book.file, `${chapter}.json`)
      const verses = JSON.parse(await readFile(sourcePath, 'utf8'))

      for (const verse of verses) {
        entries.push([book.id, chapter, verse.verse, normalizeScriptureText(verse.text)])
      }
    }
  }

  const output = {
    schemaVersion: 1,
    translationId: version.id,
    entries,
  }
  await writeFile(join(outputDir, `${version.id}.json`), JSON.stringify(output))
  console.log(`${version.id}: ${entries.length} verses`)
}
