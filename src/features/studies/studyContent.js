import manifest from '../../content/la-fe-de-jesus/manifest.json'

const lessonModules = import.meta.glob('../../content/la-fe-de-jesus/lecciones/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const EXPECTED_TOTALS = {
  lessons: 20,
  questions: 174,
  references: 188,
}

const OMITTED_SECTION_TITLES = new Set([
  'objetivo',
  'para reflexionar',
  'navegacion',
  'fuente',
])

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function parseScalar(rawValue) {
  const value = rawValue.trim()
  if (value === 'null') return null
  if (/^-?\d+$/.test(value)) return Number(value)

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value)
    } catch {
      return value.slice(1, -1)
    }
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'")
  }

  return value
}

function splitFrontmatter(raw) {
  if (typeof raw !== 'string') {
    throw new TypeError('La lección debe recibirse como Markdown sin procesar.')
  }

  const markdown = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const match = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!match) throw new Error('La lección no contiene frontmatter válido.')

  const metadata = {}
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([a-z_]+):\s*(.*)$/)
    if (field) metadata[field[1]] = parseScalar(field[2])
  }

  return {
    metadata,
    body: markdown.slice(match[0].length),
  }
}

function extractSummary(body) {
  const summaryLines = []
  let readingSummary = false

  for (const line of body.split('\n')) {
    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      readingSummary = true
      summaryLines.push(quote[1].trim())
    } else if (readingSummary) {
      break
    }
  }

  return summaryLines.join(' ').trim()
}

function assertRequiredMetadata(metadata) {
  const required = ['id', 'slug', 'title', 'order', 'previous', 'next', 'source_url']
  const missing = required.filter((field) => !(field in metadata))
  if (missing.length) {
    throw new Error(`Falta metadata requerida: ${missing.join(', ')}.`)
  }

  if (!Number.isInteger(metadata.id) || !Number.isInteger(metadata.order)) {
    throw new Error('Los campos id y order deben ser números enteros.')
  }
}

export function parseStudyLesson(raw) {
  const { metadata, body } = splitFrontmatter(raw)
  assertRequiredMetadata(metadata)

  const lessonPrefix = pad(metadata.order)
  const sections = []
  let currentSection = null
  let currentQuestion = null

  for (const line of body.split('\n')) {
    const sectionHeading = line.match(/^##\s+(.+?)\s*$/)
    if (sectionHeading) {
      const title = sectionHeading[1].trim()
      currentQuestion = null

      if (OMITTED_SECTION_TITLES.has(normalizeText(title))) {
        currentSection = null
        continue
      }

      const titleSlug = slugify(title) || pad(sections.length + 1)
      currentSection = {
        id: `s-${lessonPrefix}-${titleSlug}`,
        title,
        questions: [],
      }
      sections.push(currentSection)
      continue
    }

    const questionHeading = line.match(/^###\s+(\d+)\.\s+(.+?)\s*$/)
    if (questionHeading && currentSection) {
      const number = Number(questionHeading[1])
      currentQuestion = {
        id: `q-${lessonPrefix}-${pad(number)}`,
        number,
        prompt: questionHeading[2].trim(),
        references: [],
      }
      currentSection.questions.push(currentQuestion)
      continue
    }

    if (!currentQuestion) continue

    const referenceLine = line.match(/^\s*-\s+\*\*Referencia bíblica:\*\*\s*(.+?)\s*$/)
    if (!referenceLine) continue

    const references = [...referenceLine[1].matchAll(/`([^`]+)`/g)]
      .map((match) => match[1].trim())
      .filter(Boolean)
    currentQuestion.references.push(...references)
  }

  return {
    id: metadata.id,
    slug: metadata.slug,
    title: metadata.title,
    order: metadata.order,
    previous: metadata.previous,
    next: metadata.next,
    summary: metadata.summary ?? extractSummary(body),
    sourceUrl: metadata.source_url,
    sections,
  }
}

function getManifestFile(path) {
  const lessonDirectory = '/lecciones/'
  const directoryIndex = path.lastIndexOf(lessonDirectory)
  return directoryIndex === -1 ? path : path.slice(directoryIndex + 1)
}

const rawLessonsByFile = new Map(
  Object.entries(lessonModules).map(([path, raw]) => [getManifestFile(path), raw]),
)

export const studyLessons = manifest
  .map((entry) => {
    const raw = rawLessonsByFile.get(entry.file)
    if (!raw) throw new Error(`No se encontró el contenido de ${entry.file}.`)
    return parseStudyLesson(raw)
  })
  .sort((left, right) => left.order - right.order)

const lessonsBySlug = new Map(studyLessons.map((lesson) => [lesson.slug, lesson]))

export function getStudyLesson(slug) {
  return lessonsBySlug.get(slug) ?? null
}

export function validateStudyContent() {
  const errors = []
  const sectionIds = new Set()
  const questionIds = new Set()
  let questionCount = 0
  let referenceCount = 0

  if (lessonModules && Object.keys(lessonModules).length !== manifest.length) {
    errors.push(`El manifiesto declara ${manifest.length} lecciones, pero se importaron ${Object.keys(lessonModules).length}.`)
  }

  for (const [index, lesson] of studyLessons.entries()) {
    const manifestEntry = manifest.find((entry) => entry.slug === lesson.slug)
    const previous = studyLessons[index - 1]?.slug ?? null
    const next = studyLessons[index + 1]?.slug ?? null

    if (!manifestEntry) {
      errors.push(`La lección ${lesson.slug} no aparece en el manifiesto.`)
    } else {
      const metadataMatches = lesson.id === manifestEntry.id
        && lesson.order === manifestEntry.id
        && lesson.title === manifestEntry.title
        && lesson.summary === manifestEntry.summary
        && lesson.sourceUrl === manifestEntry.source_url
      if (!metadataMatches) errors.push(`La metadata de ${lesson.slug} no coincide con el manifiesto.`)
    }

    if (lesson.order !== index + 1) errors.push(`Orden no consecutivo en ${lesson.slug}.`)
    if (lesson.previous !== previous) errors.push(`Enlace previous incorrecto en ${lesson.slug}.`)
    if (lesson.next !== next) errors.push(`Enlace next incorrecto en ${lesson.slug}.`)
    if (!lesson.sections.length) errors.push(`La lección ${lesson.slug} no tiene secciones de estudio.`)

    let expectedQuestionNumber = 1
    for (const section of lesson.sections) {
      if (sectionIds.has(section.id)) errors.push(`ID de sección duplicado: ${section.id}.`)
      sectionIds.add(section.id)

      if (OMITTED_SECTION_TITLES.has(normalizeText(section.title))) {
        errors.push(`Se incluyó una sección de scaffold en ${lesson.slug}: ${section.title}.`)
      }
      if (!section.questions.length) errors.push(`La sección ${section.id} no tiene preguntas.`)

      for (const question of section.questions) {
        questionCount += 1
        referenceCount += question.references.length

        if (questionIds.has(question.id)) errors.push(`ID de pregunta duplicado: ${question.id}.`)
        questionIds.add(question.id)

        const expectedId = `q-${pad(lesson.order)}-${pad(question.number)}`
        if (question.id !== expectedId) errors.push(`ID inestable en la pregunta ${question.id}.`)
        if (question.number !== expectedQuestionNumber) {
          errors.push(`Numeración no consecutiva en ${lesson.slug}: ${question.number}.`)
        }
        if (!question.prompt) errors.push(`La pregunta ${question.id} no tiene texto.`)
        if (!question.references.length) errors.push(`La pregunta ${question.id} no tiene referencias.`)
        if (question.references.some((reference) => !reference)) {
          errors.push(`La pregunta ${question.id} contiene una referencia vacía.`)
        }

        expectedQuestionNumber += 1
      }
    }
  }

  const totals = {
    lessons: studyLessons.length,
    questions: questionCount,
    references: referenceCount,
  }

  for (const [label, expected] of Object.entries(EXPECTED_TOTALS)) {
    if (totals[label] !== expected) {
      errors.push(`Total inesperado de ${label}: ${totals[label]} (esperado: ${expected}).`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    totals,
  }
}
