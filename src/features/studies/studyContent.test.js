import manifest from '../../content/la-fe-de-jesus/manifest.json'
import { resolveThematicReference } from '../topics/topicReference'
import {
  getStudyLesson,
  loadStudyLesson,
  studyLessons,
} from './studyContent'
import { parseStudyLesson, validateStudyLessons } from './studyParser'

async function getLessonsWithContent() {
  return Promise.all(studyLessons.map(({ slug }) => loadStudyLesson(slug)))
}

function getQuestions(lessons) {
  return lessons.flatMap((lesson) => (
    lesson.sections.flatMap((section) => section.questions)
  ))
}

describe('La Fe de Jesús study content', () => {
  it('loads all lessons in canonical order with stable IDs', () => {
    expect(studyLessons).toHaveLength(20)
    expect(studyLessons.map((lesson) => lesson.order)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    )

    expect(getStudyLesson('quien-es-dios')).toBe(studyLessons[0])
    expect(getStudyLesson('contenido-inexistente')).toBeNull()
  })

  it('loads lesson details lazily and parses the complete set of references', async () => {
    const lessons = await getLessonsWithContent()
    const questions = getQuestions(lessons)
    const references = questions.flatMap((question) => question.references)

    expect(lessons[0].sections[0].id).toBe('s-01-dios')
    expect(lessons[0].sections[0].questions[2].id).toBe('q-01-03')
    expect(questions).toHaveLength(174)
    expect(references).toHaveLength(188)
    expect(lessons.flatMap((lesson) => lesson.checkpoints)).toHaveLength(60)
    expect(lessons.every((lesson) => lesson.assessmentRevision === 1 && lesson.checkpoints.length === 3)).toBe(true)
    expect(lessons.every((lesson) => lesson.checkpoints.every((checkpoint) => (
      checkpoint.options.length === 3
      && checkpoint.options.some((option) => option.id === checkpoint.correctOptionId)
    )))).toBe(true)
  })

  it('keeps a consistent previous and next chain', () => {
    for (const [index, lesson] of studyLessons.entries()) {
      expect(lesson.previous).toBe(studyLessons[index - 1]?.slug ?? null)
      expect(lesson.next).toBe(studyLessons[index + 1]?.slug ?? null)
    }
  })

  it('resolves every Bible reference with the existing thematic resolver', async () => {
    const lessons = await getLessonsWithContent()
    const unresolved = lessons.flatMap((lesson) => (
      lesson.sections.flatMap((section) => section.questions.flatMap((question) => (
        question.references
          .filter((reference) => !resolveThematicReference(reference))
          .map((reference) => `${question.id}: ${reference}`)
      )))
    ))

    expect(unresolved).toEqual([])
  })

  it('omits editorial scaffold from the parsed model', async () => {
    const serialized = JSON.stringify(await getLessonsWithContent())

    for (const scaffoldLabel of [
      'Objetivo',
      'Para reflexionar',
      'Navegación',
      'Fuente',
      'Interacción sugerida',
      'Respuesta personal',
    ]) {
      expect(serialized).not.toContain(scaffoldLabel)
    }
  })

  it('parses a raw lesson into the public content shape', () => {
    const lesson = parseStudyLesson(`---
id: 4
slug: "ejemplo"
title: "Lección de ejemplo"
order: 4
previous: null
next: null
source_url: "https://example.com/leccion"
---

# 04. Lección de ejemplo

> Un resumen breve.

## Objetivo

Texto que no debe exponerse.

## Tema central

### 1. ¿Qué enseña el texto?

- **Referencia bíblica:** \`Juan 3:16\`
- **Referencia bíblica:** \`Romanos 5:8\`
- **Interacción sugerida:** omitir.
- **Respuesta personal:** omitir.

## Fuente

Texto que tampoco debe exponerse.
`)

    expect(lesson).toEqual({
      id: 4,
      slug: 'ejemplo',
      title: 'Lección de ejemplo',
      order: 4,
      previous: null,
      next: null,
      summary: 'Un resumen breve.',
      sourceUrl: 'https://example.com/leccion',
      sections: [{
        id: 's-04-tema-central',
        title: 'Tema central',
        questions: [{
          id: 'q-04-01',
          number: 1,
          prompt: '¿Qué enseña el texto?',
          references: ['Juan 3:16', 'Romanos 5:8'],
        }],
      }],
    })
  })

  it('validates the canonical content repository', async () => {
    expect(validateStudyLessons(await getLessonsWithContent(), manifest)).toEqual({
      valid: true,
      errors: [],
      totals: {
        lessons: 20,
        questions: 174,
        references: 188,
      },
    })
  })
})
