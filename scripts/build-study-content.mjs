import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseStudyLesson, validateStudyLessons } from '../src/features/studies/studyParser.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentRoot = path.join(projectRoot, 'src/content/la-fe-de-jesus')
const sourceDirectory = path.join(contentRoot, 'lecciones')
const outputDirectory = path.join(contentRoot, 'generated')
const manifest = JSON.parse(await readFile(path.join(contentRoot, 'manifest.json'), 'utf8'))
const sourceFiles = (await readdir(sourceDirectory)).filter((file) => file.endsWith('.md')).sort()

if (sourceFiles.length !== manifest.length) {
  throw new Error(`El manifiesto declara ${manifest.length} lecciones, pero existen ${sourceFiles.length} archivos Markdown.`)
}

const lessons = []
for (const entry of manifest) {
  const sourceFile = path.basename(entry.file)
  if (!sourceFiles.includes(sourceFile)) throw new Error(`No se encontró ${entry.file}.`)
  const raw = await readFile(path.join(sourceDirectory, sourceFile), 'utf8')
  lessons.push(parseStudyLesson(raw))
}
lessons.sort((left, right) => left.order - right.order)

const validation = validateStudyLessons(lessons, manifest)
if (!validation.valid) throw new Error(validation.errors.join('\n'))

await rm(outputDirectory, { force: true, recursive: true })
await mkdir(outputDirectory, { recursive: true })
await Promise.all(lessons.map((lesson) => writeFile(
  path.join(outputDirectory, `${String(lesson.order).padStart(2, '0')}-${lesson.slug}.json`),
  `${JSON.stringify(lesson)}\n`,
)))

console.log(`Estudio precompilado: ${validation.totals.lessons} lecciones, ${validation.totals.questions} preguntas y ${validation.totals.references} referencias.`)
