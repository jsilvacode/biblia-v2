import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { chromium } from '@playwright/test'

// Run after `npm run build`. All storage belongs to this isolated browser.
const directory = resolve('dist')
const legacyDirectory = process.argv[2] ? resolve(process.argv[2]) : null
let activeDirectory = legacyDirectory ?? directory
let marker = 'initial'
let stallChapter = false
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png' }
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname
    if (pathname.startsWith('/_vercel/')) {
      response.writeHead(200, { 'Content-Type': 'application/javascript' }).end()
      return
    }
    if (stallChapter && pathname === '/data/nbla/43_juan/3.json') return
    let file = resolve(activeDirectory, `.${pathname}`)
    if (!file.startsWith(activeDirectory + sep)) file = resolve(activeDirectory, 'index.html')
    if (!(await stat(file).catch(() => null))?.isFile()) {
      const legacyFile = legacyDirectory && resolve(legacyDirectory, `.${pathname}`)
      file = legacyFile && (await stat(legacyFile).catch(() => null))?.isFile()
        ? legacyFile : resolve(activeDirectory, 'index.html')
    }
    let body = await readFile(file)
    if (extname(file) === '.html') body = Buffer.from(body.toString().replace('</head>', `<script>window.auditRelease=${JSON.stringify(marker)}</script></head>`))
    response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
    response.end(body)
  } catch {
    response.writeHead(500).end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()

try {
  const context = await browser.newContext()
  context.setDefaultTimeout(10_000)
  context.setDefaultNavigationTimeout(10_000)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${origin}/bible`, { waitUntil: 'domcontentloaded' })
  console.log('CHECK: installing the isolated PWA')
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated', null, { timeout: 15_000 })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 5000 })
  console.log('CHECK: service worker activated and controlling the page')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('[data-book-id="1"]').waitFor()
  console.log('CHECK: installed Bible page renders correctly')
  assert(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))

  if (legacyDirectory) {
    activeDirectory = directory
    marker = 'migrated'
    const html = await readFile(resolve(directory, 'index.html'), 'utf8')
    const entry = html.match(/<script type="module"[^>]*src="([^"]+)"/)[1]
    await page.evaluate(async () => {
      await Promise.race([
        navigator.serviceWorker.getRegistration().then((registration) => registration.update()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker update timed out')), 10_000)),
      ])
    })
    console.log('CHECK: update requested')
    await page.waitForFunction((src) => Boolean(document.querySelector(`script[src="${src}"]`)), entry, { timeout: 30_000 })
    await page.locator('[data-book-id="1"]').waitFor()
    console.log('PASS: an existing installation upgrades automatically and retains its route')
  }

  marker = 'new-online-html'
  await page.goto(`${origin}/`)
  assert.equal(await page.evaluate(() => window.auditRelease), marker)
  await page.goto(`${origin}/bible`)
  assert.equal(await page.evaluate(() => window.auditRelease), marker)
  console.log('PASS: controlled home and Bible navigations receive current HTML immediately')

  const verses = JSON.parse(await readFile(resolve(directory, 'data/nbla/43_juan/3.json'), 'utf8'))
  await page.evaluate(async (chapter) => {
    for (const name of await caches.keys()) {
      if (name === 'santa-biblia-v2-data') await (await caches.open(name)).delete('/data/nbla/43_juan/3.json')
    }
    const downloads = await caches.open('santa-biblia-v2-bible-nbla-r1')
    await downloads.put('/data/nbla/43_juan/3.json', new Response(JSON.stringify(chapter)))
    localStorage.setItem('audit-preserved-data', 'retained')
  }, verses)
  stallChapter = true
  await page.goto(`${origin}/read/43/3/16`, { waitUntil: 'domcontentloaded' })
  const start = Date.now()
  await page.locator('[data-verse-number="16"]').waitFor({ timeout: 5000 })
  console.log(`PASS: a downloaded chapter opens with a stalled network (${Date.now() - start} ms after document load)`)
  stallChapter = false

  const psalm = JSON.parse(await readFile(resolve(directory, 'data/nbla/19_salmos/23.json'), 'utf8'))
  await page.evaluate(async (chapter) => {
    await (await caches.open('santa-biblia-v2-bible-nbla-r1')).put('/data/nbla/19_salmos/23.json', new Response(JSON.stringify(chapter)))
  }, psalm)
  await context.setOffline(true)
  await page.goto(`${origin}/read/19/23`, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-verse-number="1"]').waitFor({ timeout: 5000 })
  assert.equal(await page.evaluate(() => localStorage.getItem('audit-preserved-data')), 'retained')
  assert.deepEqual(errors, [])
  console.log('PASS: an unvisited reader URL opens offline with downloaded text and preserves storage')
  await context.close()
} finally {
  const closed = new Promise((resolve) => server.close(resolve))
  server.closeAllConnections()
  await browser.close()
  await closed
}
