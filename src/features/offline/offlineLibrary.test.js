import { bibleChapterUrls, commentaryChapterUrls } from './offlineLibrary'

describe('offline library manifests', () => {
  it('covers every canonical Bible chapter for a version', () => {
    const urls = bibleChapterUrls('nbla')
    expect(urls).toHaveLength(1189)
    expect(urls).toContain('/data/nbla/43_juan/3.json')
  })

  it('aligns commentary chapters to the same canonical scope', () => {
    const urls = commentaryChapterUrls()
    expect(urls).toHaveLength(1189)
    expect(urls).toContain('/data/cba/43/3.json')
  })
})
