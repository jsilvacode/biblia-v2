function normalizeHeading(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function isRedundantEyebrow(eyebrow, title) {
  const normalizedEyebrow = normalizeHeading(eyebrow)
  const normalizedTitle = normalizeHeading(title)

  if (!normalizedEyebrow || !normalizedTitle) return false
  if (normalizedEyebrow === normalizedTitle) return true

  // A generic lead-in such as “Buscar” before “Buscar en la Biblia” repeats
  // the same idea instead of adding useful context.
  return normalizedEyebrow.length >= 5 && normalizedTitle.startsWith(`${normalizedEyebrow} `)
}

export function PageIntro({ eyebrow, title, children, action }) {
  const visibleEyebrow = isRedundantEyebrow(eyebrow, title) ? null : eyebrow

  return (
    <header className="page-intro">
      {visibleEyebrow && <p className="eyebrow">{visibleEyebrow}</p>}
      <div className="page-intro__row">
        <div>
          <h1>{title}</h1>
          {children && <p>{children}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}
