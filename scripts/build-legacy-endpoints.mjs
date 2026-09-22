import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'public', 'data')
const outputDir = join(root, 'dist', 'data')
const books = JSON.parse(await readFile(join(sourceDir, 'books.json'), 'utf8'))
const versions = JSON.parse(await readFile(join(sourceDir, 'versions.json'), 'utf8'))
const availableVersions = versions.filter(({ available }) => available)

for (const version of availableVersions) {
  const versionOutputDir = join(outputDir, version.id)
  await mkdir(versionOutputDir, { recursive: true })

  for (const book of books) {
    const chapters = []
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      const verses = JSON.parse(await readFile(join(sourceDir, version.id, book.file, `${chapter}.json`), 'utf8'))
      chapters.push({ chapter, verses })
    }

    const payload = {
      version: version.id,
      book: book.id,
      name: book.name,
      chapters,
    }
    await writeFile(join(versionOutputDir, `${book.file}.json`), JSON.stringify(payload))
  }
}

console.log(`Public Bible contract: ${books.length} aggregated books generated for ${availableVersions.map(({ id }) => id).join(', ')} outside the PWA precache.`)
