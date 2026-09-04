import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  normalizeCommentaryText,
  normalizeDisplayText,
  normalizeScriptureText,
} from '../src/features/bible/textNormalizer.js'

const DEFAULT_ROOTS = [
  'public/data/cba',
  'public/data/kjv',
  'public/data/nbla',
  'public/data/rva2015',
  'src/content/la-fe-de-jesus',
  'src/features/home/data',
  'src/features/topics/data',
]
const roots = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_ROOTS

const SUPPORTED_EXTENSIONS = new Set(['.json', '.md'])
const MAX_REPORTED_ISSUES = 80

const checks = [
  {
    id: 'replacement-character',
    pattern: /\uFFFD/gu,
  },
  {
    id: 'control-character',
    pattern: /\p{Cc}/gu,
  },
  {
    id: 'space-before-punctuation',
    pattern: /\s+[,:;!?](?=\s|$)/gu,
  },
  {
    id: 'repeated-punctuation',
    pattern: /([,;:])\1+/gu,
  },
  {
    id: 'stuck-sentence',
    pattern: /[\p{Ll}\p{M}][.!?][¿¡\p{Lu}]/gu,
    scriptureOnly: true,
  },
  {
    id: 'stuck-words',
    pattern: /\p{Ll}\p{Lu}/gu,
    scriptureOnly: true,
  },
  {
    id: 'paragraph-marker',
    pattern: /¶/gu,
  },
  {
    id: 'malformed-continuation-quote',
    pattern: /^\s*[-–—]\s*[»’”]/gu,
  },
  {
    id: 'corrupted-rtf-666',
    pattern: /(?:V5I1C100|I1666)/gu,
  },
  {
    id: 'obvious-duplicate',
    pattern: /\b(?:como como|sostiene sostiene|más que que humana|Jeremías Jeremías)\b/giu,
  },
]

async function listCorpusFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) return listCorpusFiles(target)
    return SUPPORTED_EXTENSIONS.has(path.extname(entry.name)) ? [target] : []
  }))
  return nested.flat()
}

function collectJsonStrings(value, pointer = '$', strings = []) {
  if (typeof value === 'string') {
    strings.push({ pointer, text: value })
    return strings
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectJsonStrings(entry, `${pointer}[${index}]`, strings))
    return strings
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => collectJsonStrings(entry, `${pointer}.${key}`, strings))
  }
  return strings
}

function excerpt(text, index, length) {
  const start = Math.max(0, index - 44)
  const end = Math.min(text.length, index + length + 44)
  return text.slice(start, end).replace(/\s+/gu, ' ').trim()
}

function corpusGroup(file) {
  const parts = file.split(path.sep)
  return parts[0] === 'public' && parts[1] === 'data'
    ? parts.slice(0, 3).join('/')
    : parts.slice(0, 3).join('/')
}

function isScriptureFile(file) {
  return /public[\\/]data[\\/](?:kjv|nbla|rva2015)[\\/]/u.test(file)
}

function normalizeCorpusText(file, text) {
  if (/public[\\/]data[\\/]cba[\\/]/u.test(file)) return normalizeCommentaryText(text)
  if (isScriptureFile(file)) return normalizeScriptureText(text)
  return normalizeDisplayText(text)
}

function inspectString(file, pointer, text, issues, quoteTotals, issueTotals) {
  const normalizedText = normalizeCorpusText(file, text)

  quoteTotals.curlyOpen += normalizedText.match(/“/gu)?.length ?? 0
  quoteTotals.curlyClose += normalizedText.match(/”/gu)?.length ?? 0
  quoteTotals.guillemetOpen += normalizedText.match(/«/gu)?.length ?? 0
  quoteTotals.guillemetClose += normalizedText.match(/»/gu)?.length ?? 0

  for (const check of checks) {
    if (check.scriptureOnly && !isScriptureFile(file)) continue
    check.pattern.lastIndex = 0
    for (const match of normalizedText.matchAll(check.pattern)) {
      const summaryKey = `${corpusGroup(file)} · ${check.id}`
      issueTotals.set(summaryKey, (issueTotals.get(summaryKey) ?? 0) + 1)
      issues.push({
        check: check.id,
        excerpt: excerpt(normalizedText, match.index, match[0].length),
        file,
        pointer,
      })
    }
  }
}

const files = (await Promise.all(roots.map(listCorpusFiles))).flat().sort()
const issues = []
const quoteTotals = {
  curlyClose: 0,
  curlyOpen: 0,
  guillemetClose: 0,
  guillemetOpen: 0,
}
const issueTotals = new Map()
let stringCount = 0

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const entries = path.extname(file) === '.json'
    ? collectJsonStrings(JSON.parse(source))
    : [{ pointer: '$', text: source }]

  stringCount += entries.length
  entries.forEach(({ pointer, text }) => inspectString(file, pointer, text, issues, quoteTotals, issueTotals))
}

console.log(`Corpus audit: ${files.length} files, ${stringCount} text entries.`)
console.log(`Quotes: “ ${quoteTotals.curlyOpen} / ” ${quoteTotals.curlyClose}; « ${quoteTotals.guillemetOpen} / » ${quoteTotals.guillemetClose}.`)

if (issues.length > 0) {
  console.error(`Found ${issues.length} high-confidence typography issue(s):`)
  Array.from(issueTotals.entries())
    .sort((left, right) => right[1] - left[1])
    .forEach(([label, count]) => console.error(`  ${count.toString().padStart(4)} · ${label}`))
  issues.slice(0, MAX_REPORTED_ISSUES).forEach((issue) => {
    console.error(`- [${issue.check}] ${issue.file} ${issue.pointer}: ${issue.excerpt}`)
  })
  if (issues.length > MAX_REPORTED_ISSUES) {
    console.error(`- …and ${issues.length - MAX_REPORTED_ISSUES} more.`)
  }
  process.exitCode = 1
} else {
  console.log('Normalized presentation is free of control characters, malformed punctuation and high-confidence joined words.')
}
