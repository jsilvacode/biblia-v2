import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import promises from './data/dailyPromises.json'
import { getBook } from '../bible/catalog'
import { normalizeScriptureText } from '../bible/textNormalizer'
import { formatPromiseReference, getDailyPromise, getPromiseText, getPromiseVerses } from './dailyPromise'

const versions = ['nbla', 'rva2015', 'kjv']

describe('daily promises calendar', () => {
  it('contains one unique, valid promise for every calendar day', () => {
    expect(promises).toHaveLength(365)
    const keys = new Set(promises.map((promise) => `${promise.month}-${promise.day}`))
    expect(keys.size).toBe(365)
    expect(new Set(promises.map((promise) => JSON.stringify(promise.reference))).size).toBe(365)

    for (const promise of promises) {
      expect(promise.day).toBeGreaterThanOrEqual(1)
      expect(promise.day).toBeLessThanOrEqual(new Date(2025, promise.month, 0).getDate())
      expect(getBook(promise.reference.book)).not.toBeNull()
      expect(promise.reference.verseEnd).toBeGreaterThanOrEqual(promise.reference.verseStart)
    }
  })

  it('uses February 28 for February 29 without changing the normal date mapping', () => {
    expect(getDailyPromise(new Date(2024, 1, 29, 12))).toEqual(getDailyPromise(new Date(2024, 1, 28, 12)))
    expect(getDailyPromise(new Date(2026, 0, 1, 12))?.reference).toEqual({
      book: 1,
      chapter: 9,
      verseStart: 13,
      verseEnd: 13,
    })
  })

  it('resolves complete, compact passages in each bundled Bible version', () => {
    const chapterCache = new Map()
    const getChapter = (version, book, chapter) => {
      const key = `${version}:${book.id}:${chapter}`
      if (!chapterCache.has(key)) {
        const path = join(process.cwd(), 'public', 'data', version, book.file, `${chapter}.json`)
        chapterCache.set(key, JSON.parse(readFileSync(path, 'utf8')))
      }
      return chapterCache.get(key)
    }

    for (const promise of promises) {
      const book = getBook(promise.reference.book)
      for (const version of versions) {
        const verses = getPromiseVerses(getChapter(version, book, promise.reference.chapter), promise)
        expect(verses).toHaveLength(promise.reference.verseEnd - promise.reference.verseStart + 1)
        const text = getPromiseText(verses.map((verse) => ({ ...verse, text: normalizeScriptureText(verse.text) })), promise)
        expect(text.length, `${version}: ${promise.month}-${promise.day}`).toBeLessThanOrEqual(260)
        if (version === 'nbla') {
          expect(text.length).toBeGreaterThanOrEqual(55)
          expect(text.length).toBeLessThanOrEqual(240)
        }
      }
    }
  })

  it('formats localized references and strips only presentation markers from scripture', () => {
    const promise = getDailyPromise(new Date(2026, 0, 8, 12))
    expect(formatPromiseReference(promise, 'es')).toBe('Génesis 46:3-4')
    expect(formatPromiseReference(promise, 'en')).toBe('Genesis 46:3-4')
    expect(getPromiseText([{ verse: 3, text: '¶ Texto de prueba' }, { verse: 4, text: 'Segundo texto' }], promise)).toBe('Texto de prueba Segundo texto')
  })

  it('removes an orphan closing guillemet when a single-verse excerpt starts mid-speech', () => {
    const promise = { reference: { verseStart: 37, verseEnd: 37 } }
    expect(getPromiseText([{ verse: 37, text: 'Porque ninguna cosa será imposible para Dios».' }], promise))
      .toBe('Porque ninguna cosa será imposible para Dios.')
  })

  it('removes orphan boundary guillemets without altering a balanced quotation', () => {
    const promise = { reference: { verseStart: 1, verseEnd: 1 } }
    expect(getPromiseText([{ verse: 1, text: '»No temas, rebaño pequeño.' }], promise))
      .toBe('No temas, rebaño pequeño.')
    expect(getPromiseText([{ verse: 1, text: '«Yo estoy contigo».' }], promise))
      .toBe('«Yo estoy contigo».')
  })

  it('keeps joined verses readable when a later verse starts a new speech paragraph', () => {
    const promise = { reference: { verseStart: 18, verseEnd: 19 } }
    expect(getPromiseText([{ verse: 18, text: 'Vendré a ustedes.' }, { verse: 19, text: '»Porque Yo vivo, ustedes también vivirán.' }], promise))
      .toBe('Vendré a ustedes. Porque Yo vivo, ustedes también vivirán.')
    expect(getPromiseText([{ verse: 18, text: 'Nada es imposible para Dios».' }, { verse: 19, text: 'María dijo: «Hágase conforme a tu palabra».' }], promise))
      .toBe('Nada es imposible para Dios. María dijo: «Hágase conforme a tu palabra».')
  })
})
