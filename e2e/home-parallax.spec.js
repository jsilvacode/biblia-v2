import { expect, test } from '@playwright/test'

async function openHome(page, reducedMotion) {
  await page.emulateMedia({ reducedMotion })
  await page.route('**/api/daily-video?*', (route) => route.fulfill({ json: {
    schemaVersion: 1,
    date: new URL(route.request().url()).searchParams.get('date'),
    status: 'pending',
    episode: null,
    checkedAt: new Date().toISOString(),
    provenance: 'wordpress',
  } }))
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Promesa del día', exact: true })).toHaveAttribute('aria-busy', 'false')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  return page.locator('.home-page')
}

const translationY = (layer) => layer.evaluate((element) => {
  const transform = getComputedStyle(element).transform
  return transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42
})

test('Home gives decorative layers depth while its reading text follows the normal page flow', async ({ page }) => {
  const home = await openHome(page, 'no-preference')
  await expect(home).toHaveAttribute('data-home-motion', 'active')
  const landscape = home.locator('[data-home-parallax="landscape"]')
  const far = home.locator('[data-home-parallax="ambient-far"]')
  const near = home.locator('[data-home-parallax="ambient-near"]')
  const heading = home.getByRole('heading', { level: 1 })
  await expect(landscape).toHaveCount(1)
  await expect(heading).toBeVisible()
  const initialLandscape = await translationY(landscape)
  const initialTextTop = await heading.evaluate((element) => element.getBoundingClientRect().top)

  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }))
  await expect.poll(() => translationY(landscape)).toBeGreaterThan(initialLandscape)
  await expect.poll(async () => Math.abs(await translationY(far) - await translationY(near))).toBeGreaterThan(1)
  const flow = await heading.evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    transform: getComputedStyle(element).transform,
    scroll: window.scrollY,
  }))
  expect(flow.transform).toBe('none')
  expect(Math.abs(flow.top + flow.scroll - initialTextTop)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  // The same image remains in the viewport behind the later editorial grid.
  await home.getByRole('region', { name: 'También en Santa Biblia' }).scrollIntoViewIfNeeded()
  const scene = await landscape.evaluate((picture) => {
    const windowBounds = picture.parentElement.getBoundingClientRect()
    const sectionBounds = document.getElementById('home-editorial-heading').parentElement.getBoundingClientRect()
    return { windowTop: windowBounds.top, windowBottom: windowBounds.bottom, sectionTop: sectionBounds.top, sectionBottom: sectionBounds.bottom }
  })
  expect(scene.windowTop).toBeLessThan(scene.sectionBottom)
  expect(scene.windowBottom).toBeGreaterThan(scene.sectionTop)
})

test('Home keeps all parallax layers still when reduced motion is requested', async ({ page }) => {
  const home = await openHome(page, 'reduce')
  await expect(home).toHaveAttribute('data-home-motion', 'reduced')
  const layers = home.locator('[data-home-parallax]')
  expect(await layers.count()).toBeGreaterThanOrEqual(3)
  const transforms = () => layers.evaluateAll((elements) => elements.map((element) => ({
    transform: getComputedStyle(element).transform,
    willChange: getComputedStyle(element).willChange,
  })))
  const before = await transforms()
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'instant' }))
  await expect.poll(transforms).toEqual(before)
  for (const layer of before) {
    expect(layer.transform).toBe('none')
    expect(layer.willChange).not.toContain('transform')
  }
})
