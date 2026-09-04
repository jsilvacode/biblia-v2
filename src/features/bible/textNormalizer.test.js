import { describe, expect, it } from 'vitest'
import {
  normalizeCommentaryData,
  normalizeCommentaryText,
  normalizeDisplayText,
  normalizeScriptureText,
} from './textNormalizer'

describe('text normalizer', () => {
  it('cleans presentation artifacts without changing the source data', () => {
    expect(normalizeDisplayText('  ¶ Texto\u00A0 con   espacio , y k\u008Dtos.\u200B  '))
      .toBe('Texto con espacio, y kētos.')
  })

  it('repairs high-confidence scripture joins and malformed quote markers', () => {
    expect(normalizeScriptureText('-»El Padre queme envió; porJerusalén y sonMis discípulos.'))
      .toBe('«El Padre que me envió; por Jerusalén y son Mis discípulos.')
    expect(normalizeScriptureText('todo lo que ustedes atenen la tierra, seráatado en el cielo'))
      .toBe('todo lo que ustedes aten en la tierra, será atado en el cielo')
    expect(normalizeScriptureText('El que los queme lavará sus ropas.'))
      .toBe('El que los queme lavará sus ropas.')
  })

  it('preserves legitimate continuation guillemets at the start of a verse', () => {
    expect(normalizeScriptureText('»Permanezcan en Mí.')).toBe('»Permanezcan en Mí.')
    expect(normalizeScriptureText('-’Aumenta la leña.')).toBe('»Aumenta la leña.')
  })

  it('repairs additional joined words found by the full corpus audit', () => {
    expect(normalizeScriptureText('El Consoladorpara ustedes; el nombre queme diste.'))
      .toBe('El Consolador para ustedes; el nombre que me diste.')
    expect(normalizeScriptureText('¿Qué discusionesson estas? Recibela vista.'))
      .toBe('¿Qué discusiones son estas? Recibe la vista.')
  })

  it('replaces the corrupted 666 table with readable content', () => {
    const source = 'Times New Roman;Calibri;Georgia;;;*Riched20 5.40.11.2210;V5I1C100A----R----I1V(U=V)5S----F----I1L50I1I1D500E----I1666'

    expect(normalizeCommentaryText(source))
      .toBe('V (5) + I (1) + C (100) + I (1) + V (5) + I (1) + L (50) + I (1) + I (1) + D (500) + I (1) = 666.')
  })

  it('normalizes commentary blocks recursively and removes obvious duplicates', () => {
    const source = {
      18: {
        b: [
          ['h', 'Aquí hay sabiduría.'],
          ['p', 'Jeremías Jeremías sostiene sostiene que es más que que humana.'],
        ],
      },
    }

    expect(normalizeCommentaryData(source)[18].b[1][1])
      .toBe('Jeremías sostiene que es más que humana.')
    expect(source[18].b[1][1]).toContain('sostiene sostiene')
  })
})
