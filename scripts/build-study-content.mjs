import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseStudyLesson, validateStudyLessons } from '../src/features/studies/studyParser.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentRoot = path.join(projectRoot, 'src/content/la-fe-de-jesus')
const sourceDirectory = path.join(contentRoot, 'lecciones')
const evaluationDirectory = path.join(contentRoot, 'evaluaciones')
const outputDirectory = path.join(contentRoot, 'generated')
const manifest = JSON.parse(await readFile(path.join(contentRoot, 'manifest.json'), 'utf8'))
const sourceFiles = (await readdir(sourceDirectory)).filter((file) => file.endsWith('.md')).sort()
const evaluationFiles = (await readdir(evaluationDirectory)).filter((file) => file.endsWith('.json')).sort()

if (sourceFiles.length !== manifest.length) {
  throw new Error(`El manifiesto declara ${manifest.length} lecciones, pero existen ${sourceFiles.length} archivos Markdown.`)
}

if (evaluationFiles.length !== manifest.length) {
  throw new Error(`Se requieren ${manifest.length} evaluaciones, pero existen ${evaluationFiles.length} archivos JSON.`)
}

function validateEvaluation(lesson, evaluation, fileName) {
  const errors = []
  const questions = lesson.sections.flatMap((section) => section.questions)
  const questionsById = new Map(questions.map((question) => [question.id, question]))
  const checkpoints = Array.isArray(evaluation.checkpoints) ? evaluation.checkpoints : []
  if (evaluation.lessonSlug !== lesson.slug) errors.push(`${fileName}: lessonSlug no coincide con ${lesson.slug}.`)
  if (!Number.isInteger(evaluation.revision) || evaluation.revision < 1) errors.push(`${fileName}: revision debe ser un entero positivo.`)
  if (checkpoints.length !== 3) errors.push(`${fileName}: debe contener exactamente 3 ejercicios.`)
  if (new Set(checkpoints.map((checkpoint) => checkpoint?.id)).size !== checkpoints.length) {
    errors.push(`${fileName}: existen IDs de ejercicio duplicados.`)
  }

  for (const checkpoint of checkpoints) {
    const prefix = `${fileName}/${checkpoint?.id ?? 'sin-id'}`
    const question = questionsById.get(checkpoint?.id)
    if (!question) {
      errors.push(`${prefix}: el ejercicio no corresponde a una pregunta de la lección.`)
      continue
    }
    if (typeof checkpoint.prompt !== 'string' || !checkpoint.prompt.trim()) errors.push(`${prefix}: falta prompt.`)
    const references = Array.isArray(checkpoint.references) ? checkpoint.references : []
    if (!references.length || references.some((reference) => !question.references.includes(reference))) {
      errors.push(`${prefix}: las referencias deben ser un subconjunto no vacío del apartado.`)
    }
    const options = Array.isArray(checkpoint.options) ? checkpoint.options : []
    if (options.length !== 3) errors.push(`${prefix}: debe contener exactamente 3 alternativas.`)
    const optionIds = options.map((option) => option?.id)
    const optionTexts = options.map((option) => option?.text?.trim())
    if (new Set(optionIds).size !== options.length || optionIds.some((id) => typeof id !== 'string' || !id)) {
      errors.push(`${prefix}: los IDs de alternativas deben ser cadenas únicas.`)
    }
    if (new Set(optionTexts).size !== options.length || optionTexts.some((text) => !text)) {
      errors.push(`${prefix}: los textos de alternativas deben ser únicos y no vacíos.`)
    }
    if (options.some((option) => typeof option?.feedback !== 'string' || !option.feedback.trim())) {
      errors.push(`${prefix}: cada alternativa debe incluir feedback.`)
    }
    if (!optionIds.includes(checkpoint.correctOptionId)) errors.push(`${prefix}: correctOptionId no es una alternativa válida.`)
  }
  return errors
}

const lessons = []
for (const entry of manifest) {
  const sourceFile = path.basename(entry.file)
  if (!sourceFiles.includes(sourceFile)) throw new Error(`No se encontró ${entry.file}.`)
  const raw = await readFile(path.join(sourceDirectory, sourceFile), 'utf8')
  const lesson = parseStudyLesson(raw)
  const evaluationFile = `${String(entry.id).padStart(2, '0')}-${entry.slug}.json`
  if (!evaluationFiles.includes(evaluationFile)) throw new Error(`No se encontró evaluaciones/${evaluationFile}.`)
  const evaluation = JSON.parse(await readFile(path.join(evaluationDirectory, evaluationFile), 'utf8'))
  const evaluationErrors = validateEvaluation(lesson, evaluation, evaluationFile)
  if (evaluationErrors.length) throw new Error(evaluationErrors.join('\n'))
  lessons.push({
    ...lesson,
    assessmentRevision: evaluation.revision,
    checkpoints: evaluation.checkpoints,
  })
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

console.log(`Estudio precompilado: ${validation.totals.lessons} lecciones, ${validation.totals.questions} preguntas, ${validation.totals.references} referencias y ${lessons.reduce((total, lesson) => total + lesson.checkpoints.length, 0)} ejercicios.`)
