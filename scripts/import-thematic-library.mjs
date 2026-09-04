import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const sourcePath = process.argv[2]

if (!sourcePath) {
  throw new Error('Usage: node scripts/import-thematic-library.mjs <source.md> [output.json]')
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = resolve(process.argv[3] ?? `${projectRoot}/src/features/topics/data/topics.es.json`)
const source = await readFile(resolve(sourcePath), 'utf8')

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const categories = []
let category = null
let situation = null

for (const rawLine of source.split(/\r?\n/u)) {
  const line = rawLine.trim()
  const categoryMatch = line.match(/^##\s+(\d+)\.\s+(.+)$/u)
  const situationMatch = line.match(/^###\s+(.+)$/u)
  const centralMatch = line.match(/^\*\*Lectura central:\*\*\s+(.+)$/u)
  const companionsMatch = line.match(/^\*\*Para acompañar:\*\*\s+(.+)$/u)

  if (categoryMatch) {
    category = {
      id: slugify(categoryMatch[2]),
      number: Number(categoryMatch[1]),
      title: categoryMatch[2],
      situations: [],
    }
    categories.push(category)
    situation = null
    continue
  }

  if (/^##\s+/u.test(line)) {
    category = null
    situation = null
    continue
  }

  if (situationMatch && category) {
    situation = {
      id: slugify(situationMatch[1]),
      title: situationMatch[1],
      central: '',
      companions: [],
    }
    category.situations.push(situation)
    continue
  }

  if (centralMatch && situation) {
    situation.central = centralMatch[1]
    continue
  }

  if (companionsMatch && situation) {
    situation.companions = companionsMatch[1].split(/\s+·\s+/u)
  }
}

const totalSituations = categories.reduce((total, item) => total + item.situations.length, 0)

if (categories.length !== 13 || totalSituations !== 92) {
  throw new Error(`Unexpected thematic library shape: ${categories.length} categories, ${totalSituations} situations`)
}

const payload = {
  version: '1.0',
  language: 'es',
  title: 'Mini biblioteca temática bíblica',
  subtitle: 'Qué leer cuando…',
  totalSituations,
  categories,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`)

console.log(`Imported ${categories.length} categories and ${totalSituations} situations into ${outputPath}`)
