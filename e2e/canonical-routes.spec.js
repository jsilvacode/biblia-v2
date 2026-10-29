import { expect, test } from '@playwright/test'

test('legacy public URLs redirect to canonical routes while preserving reader queries', async ({ page }) => {
  await page.goto('/bible?q=corint')
  await expect(page).toHaveURL(/\/biblia\?q=corint$/)

  await page.goto('/read/43/3/16?v=nbla')
  await expect(page).toHaveURL(/\/biblia\/juan\/3\/16\?v=nbla$/)

  await page.goto('/beliefs')
  await expect(page).toHaveURL(/\/creencias$/)

  await page.goto('/studies/la-fe-de-jesus/quien-es-dios')
  await expect(page).toHaveURL(/\/fe-de-jesus\/quien-es-dios$/)

  await page.goto('/fedejesus')
  await expect(page).toHaveURL(/\/fe-de-jesus$/)
})
