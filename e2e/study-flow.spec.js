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

test('a reader advances sequentially, retries answers and keeps progress when returning from the Bible', async ({ page }) => {
  await clearStudyProgress(page)
  await page.getByRole('link', { name: studyName }).click()

  await expect(page).toHaveURL(/\/studies\/la-fe-de-jesus$/)
  await expect(page.getByRole('heading', { name: studyName })).toBeVisible()
  await expect(page.locator('ol li')).toHaveCount(20)
  await expect(page.getByText(/Completa primero la lección 1|Complete lesson 1 first|Conclua primeiro a lição 1/).first()).toBeVisible()
  await page.goto('/studies/la-fe-de-jesus/la-santa-biblia')
  await expect(page.getByText(/Completa primero la lección 1|Complete lesson 1 first|Conclua primeiro a lição 1/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'La Santa Biblia' })).toBeVisible()

  await page.goto('/studies/la-fe-de-jesus')

  await page.getByRole('link', { name: /¿Quién es Dios\?/ }).click()
  await expect(page).toHaveURL(/\/studies\/la-fe-de-jesus\/quien-es-dios$/)
  await expect(page.getByRole('heading', { name: '¿Quién es Dios?', exact: true })).toBeVisible()

  const firstQuestion = page.locator('details').first()
  await firstQuestion.locator('summary').click()
  await expect(firstQuestion).toHaveAttribute('open', '')
  await expect(firstQuestion.getByRole('heading', { name: /Efesios 4:6/ })).toBeVisible()

  const firstCheck = firstQuestion.locator('form')
  await firstCheck.getByRole('radio').first().check()
  await firstCheck.getByRole('button', { name: /Comprobar respuesta|Check answer|Conferir resposta/ }).click()
  await expect(firstCheck.getByText(/Aún no|Not yet|Ainda não/).first()).toBeVisible()
  await firstCheck.getByRole('radio').nth(1).check()
  await expect(firstCheck.getByText(/Aún no|Not yet|Ainda não/)).toHaveCount(0)
  await firstCheck.getByRole('button', { name: /Comprobar respuesta|Check answer|Conferir resposta/ }).click()
  await expect(firstCheck.getByText(/Correcto|Correct|Correto/).first()).toBeVisible()

  await firstQuestion.getByRole('link', { name: /Leer en el lector|Read in reader|Ler no leitor/ }).click()
  await expect(page).toHaveURL(/\/read\/49\/4\/6$/)
  const backToStudy = page.getByRole('button', { name: /Volver al estudio|Back to the study|Voltar ao estudo/ })
  await expect(backToStudy).toBeVisible()
  await backToStudy.click()

  await expect(page).toHaveURL(/\/studies\/la-fe-de-jesus\/quien-es-dios#q-01-01$/)
  await expect(page.locator('#q-01-01')).toHaveAttribute('open', '')
  await expect(page.locator('#q-01-01')).toBeInViewport()
  await expect(page.locator('#q-01-01 form').getByText(/Correcto|Correct|Correto/).first()).toBeVisible()

  const completeButton = page.getByRole('button', { name: /Marcar lección como completada|Mark lesson as completed|Marcar lição como concluída/ })
  await expect(completeButton).toBeDisabled()

  for (const questionId of ['q-01-02', 'q-01-04']) {
    const question = page.locator(`#${questionId}`)
    await question.locator('summary').click()
    const check = question.locator('form')
    for (let optionIndex = 0; optionIndex < 3; optionIndex += 1) {
      await check.getByRole('radio').nth(optionIndex).check()
      await check.getByRole('button', { name: /Comprobar respuesta|Check answer|Conferir resposta/ }).click()
      if (await check.getByText(/Correcto|Correct|Correto/).first().isVisible()) break
    }
    await expect(check.getByText(/Correcto|Correct|Correto/).first()).toBeVisible()
  }

  await page.getByRole('checkbox', { name: /He leído los pasajes|I have read the passages|Li as passagens/ }).check()
  await expect(completeButton).toBeEnabled()
  await completeButton.click()
  await expect(page.getByText(/Lección completada|Lesson completed|Lição concluída/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Siguiente lección.*La Santa Biblia|Next lesson.*La Santa Biblia|Próxima lição.*La Santa Biblia/ })).toBeVisible()
  await page.getByRole('link', { name: /Volver al estudio|Back to the study|Voltar ao estudo/ }).first().click()

  await expect(page.getByText(/1 de 20 lecciones|1 of 20 lessons|1 de 20 lições/).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /La Santa Biblia/ })).toBeVisible()
})
