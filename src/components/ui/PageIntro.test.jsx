import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageIntro } from './PageIntro'

describe('PageIntro', () => {
  it('omits an eyebrow that repeats the title', () => {
    render(<PageIntro eyebrow="Guardados" title="Guardados" />)

    expect(screen.getByRole('heading', { name: 'Guardados' })).toBeTruthy()
    expect(screen.getAllByText('Guardados')).toHaveLength(1)
  })

  it('omits a generic eyebrow repeated at the beginning of the title', () => {
    render(<PageIntro eyebrow="Buscar" title="Buscar en la Biblia" />)

    expect(screen.queryByText('Buscar', { exact: true })).toBeNull()
  })

  it('keeps an eyebrow when it adds editorial context', () => {
    render(<PageIntro eyebrow="Guía de consulta bíblica" title="Qué leer cuando…" />)

    expect(screen.getByText('Guía de consulta bíblica')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Qué leer cuando…' })).toBeTruthy()
  })
})
