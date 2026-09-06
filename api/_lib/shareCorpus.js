import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function loadLocalChapter({ book, chapter, version }) {
  return JSON.parse(await readFile(
    join(process.cwd(), 'public', 'data', version.id, book.file, `${chapter}.json`),
    'utf8',
  ))
}
