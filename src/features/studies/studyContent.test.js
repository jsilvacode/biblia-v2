import { resolveThematicReference } from '../topics/topicReference'
import {
  getStudyLesson,
  parseStudyLesson,
  studyLessons,
  validateStudyContent,
} from './studyContent'

function getQuestions() {
  return studyLessons.flatMap((lesson) => (
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
    expect(studyLessons[0].sections[0].id).toBe('s-01-dios')
    expect(studyLessons[0].sections[0].questions[2].id).toBe('q-01-03')
  })

  it('parses the complete set of questions and references', () => {
    const questions = getQuestions()
    const references = questions.flatMap((question) => question.references)

    expect(questions).toHaveLength(174)
    expect(references).toHaveLength(188)
  })

  it('keeps a consistent previous and next chain', () => {
    for (const [index, lesson] of studyLessons.entries()) {
      expect(lesson.previous).toBe(studyLessons[index - 1]?.slug ?? null)
      expect(lesson.next).toBe(studyLessons[index + 1]?.slug ?? null)
    }
  })

  it('resolves every Bible reference with the existing thematic resolver', () => {
    const unresolved = studyLessons.flatMap((lesson) => (
      lesson.sections.flatMap((section) => section.questions.flatMap((question) => (
        question.references
          .filter((reference) => !resolveThematicReference(reference))
          .map((reference) => `${question.id}: ${reference}`)
      )))
    ))

    expect(unresolved).toEqual([])
  })

  it('omits editorial scaffold from the parsed model', () => {
    const serialized = JSON.stringify(studyLessons)

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

  it('validates the canonical content repository', () => {
    expect(validateStudyContent()).toEqual({
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
