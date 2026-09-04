export const READER_FONT_SCALE_MIN = 0.85
export const READER_FONT_SCALE_MAX = 1.3
export const READER_FONT_SCALE_STEP = 0.05

export function normalizeReaderFontScale(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 1

  return Number(Math.min(
    READER_FONT_SCALE_MAX,
    Math.max(READER_FONT_SCALE_MIN, numericValue),
  ).toFixed(2))
}

export function adjustReaderFontScale(value, direction) {
  return normalizeReaderFontScale(
    normalizeReaderFontScale(value) + (READER_FONT_SCALE_STEP * direction),
  )
}

export function readerFontScalePercentage(value) {
  return Math.round(normalizeReaderFontScale(value) * 100)
}
