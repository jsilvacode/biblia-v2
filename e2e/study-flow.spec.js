import { expect, test } from '@playwright/test'

const studyName = /La Fe de Jesús|The Faith of Jesus|A Fé de Jesus/

async function clearStudyProgress(page) {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.removeItem('santa-biblia-v2:study:la-fe-de-jesus:v1'))
  await page.reload()
}

test('Home opens the Bible study and publishes the four selected interest links', async ({ page }) => {
  await clearStudyProgress(page)

  const studyCard = page.getByRole('link', { name: studyName })
  await expect(studyCard).toBeVisible()
  await expect(studyCard).toHaveAttribute('href', '/studies/la-fe-de-jesus')

  const interests = page.getByRole('region', { name: /Enlaces de interés|Links of interest|Links de interesse/ })
  await expect(interests.getByRole('link')).toHaveCount(4)
  await expect(interests.getByRole('link', { name: /Escuela Sabática/ })).toHaveAttribute('href', 'https://escuelasabatica.cl/')
  await expect(interests.getByRole('link', { name: /Diálogo Bíblico/ })).toHaveAttribute('href', /youtube\.com\/playlist\?list=PLn19CCwh0uJwsZM3-89oEGdorLikq9hFS/)
  await expect(interests.getByRole('link', { name: /Nuevo Tiempo/ })).toHaveAttribute('href', 'https://nuevotiempo.cl/')
  await expect(interests.getByRole('link', { name: /ADRA/ })).toHaveAttribute('href', 'https://adra.cl/')
})

test('a reader can study a question, open its Bible passage, return in place and complete the lesson', async ({ page }) => {
  await clearStudyProgress(page)
  await page.getByRole('link', { name: studyName }).click()

  await expect(page).toHaveURL(/\/studies\/la-fe-de-jesus$/)
  await expect(page.getByRole('heading', { name: studyName })).toBeVisible()
  await expect(page.locator('ol li')).toHaveCount(20)

  await page.getByRole('link', { name: /¿Quién es Dios\?/ }).click()
  await expect(page).toHaveURL(/\/studies\/la-fe-de-jesus\/quien-es-dios$/)
  await expect(page.getByRole('heading', { name: '¿Quién es Dios?', exact: true })).toBeVisible()

  const firstQuestion = page.locator('details').first()
  await firstQuestion.locator('summary').click()
  await expect(firstQuestion).toHaveAttribute('open', '')
  await expect(firstQuestion.getByRole('heading', { name: /Efesios 4:6/ })).toBeVisible()

  await firstQuestion.getByRole('link', { name: /Leer en el lector|Read in reader|Ler no leitor/ }).click()
  await expect(page).toHaveURL(/\/read\/49\/4\/6$/)
  const backToStudy = page.getByRole('button', { name: /Volver al estudio|Back to the study|Voltar ao estudo/ })
  await expect(backToStudy).toBeVisible()
  await backToStudy.click()

  await expect(page).toHaveURL(/\/studies\/la-fe-de-jesus\/quien-es-dios#q-01-01$/)
  await expect(page.locator('#q-01-01')).toHaveAttribute('open', '')
  await expect(page.locator('#q-01-01')).toBeInViewport()

  await page.getByRole('button', { name: /Marcar lección como completada|Mark lesson as completed|Marcar lição como concluída/ }).click()
  await expect(page.getByText(/Lección completada|Lesson completed|Lição concluída/)).toBeVisible()
  await page.getByRole('link', { name: /Volver al estudio|Back to the study|Voltar ao estudo/ }).first().click()

  await expect(page.getByText(/1 de 20 lecciones|1 of 20 lessons|1 de 20 lições/).first()).toBeVisible()
})
