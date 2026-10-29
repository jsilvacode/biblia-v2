export function getBookRouteSlug(book) {
  return book?.slug.replace(/^([1-3])(?=[a-z])/u, '$1-') ?? ''
}

export function findBookByRouteSlug(slug, books) {
  const normalized = String(slug ?? '').toLocaleLowerCase()
  const compact = normalized.replaceAll('-', '')
  return books.find((book) => getBookRouteSlug(book) === normalized || book.slug === compact) ?? null
}
