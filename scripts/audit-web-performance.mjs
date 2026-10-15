import { writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const baseURL = process.argv[2] ?? 'http://127.0.0.1:4177'
const output = process.argv[3]
const browser = await chromium.launch()
const samples = []

try {
  for (const path of ['/read/43/3/16', '/bible', '/']) {
    for (let run = 0; run < 3; run += 1) {
      const context = await browser.newContext({ serviceWorkers: 'block' })
      const page = await context.newPage()
      const session = await context.newCDPSession(page)
      await session.send('Network.enable')
      await session.send('Network.emulateNetworkConditions', {
        offline: false, latency: 150, downloadThroughput: 250_000, uploadThroughput: 125_000,
      })
      await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.addInitScript(() => {
        window.auditMetrics = { ready: null, lcp: null, longTasks: [] }
        const selector = location.pathname.startsWith('/read/') ? '[data-verse-number="1"]'
          : location.pathname === '/bible' ? '[data-book-id="1"]' : 'section[aria-busy="false"] h1'
        const observer = new MutationObserver(() => {
          if (document.querySelector(selector)) {
            window.auditMetrics.ready = performance.now()
            observer.disconnect()
          }
        })
        observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-busy'] })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.auditMetrics.lcp = entry.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.auditMetrics.longTasks.push(entry.duration)
        }).observe({ type: 'longtask', buffered: true })
      })
      for (const cache of ['cold', 'warm']) {
        if (cache === 'cold') await page.goto(`${baseURL}${path}`, { waitUntil: 'domcontentloaded' })
        else await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForFunction(() => window.auditMetrics.ready !== null)
        await page.waitForTimeout(350)
        const metrics = await page.evaluate(() => ({
          ...window.auditMetrics,
          ttfb: performance.getEntriesByType('navigation')[0].responseStart,
          resources: performance.getEntriesByType('resource').filter((entry) => entry.name.startsWith(location.origin)).map((entry) => ({
            path: new URL(entry.name).pathname, start: entry.startTime, end: entry.responseEnd, bytes: entry.transferSize,
          })),
        }))
        samples.push({ path, cache, run, ...metrics })
      }
      await context.close()
    }
  }
} finally {
  await browser.close()
}

const median = (values) => Math.round(values.sort((a, b) => a - b)[Math.floor(values.length / 2)])
const summary = [...new Set(samples.map(({ path }) => path))].flatMap((path) => ['cold', 'warm'].map((cache) => {
  const matching = samples.filter((sample) => sample.path === path && sample.cache === cache)
  return {
    path, cache,
    contentReadyMs: median(matching.map(({ ready }) => ready)),
    lcpMs: median(matching.map(({ lcp }) => lcp)),
    transferredKB: median(matching.map(({ resources }) => resources.reduce((total, resource) => total + resource.bytes, 0) / 1024)),
    chapterRequestStartMs: path.startsWith('/read/') ? median(matching.map(({ resources }) => resources.find(({ path: url }) => url === '/data/nbla/43_juan/3.json').start)) : undefined,
  }
}))
const report = { baseURL, measuredAt: new Date().toISOString(), conditions: { latencyMs: 150, downloadBytesPerSecond: 250_000, cpuSlowdown: 4, serviceWorkers: 'blocked', runs: 3 }, summary, samples }
if (output) await writeFile(output, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
