import { expect, test } from '@playwright/test'

const studyName = /La Fe de Jesús|The Faith of Jesus|A Fé de Jesus/

async function clearStudyProgress(page) {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.removeItem('santa-biblia-v2:study:la-fe-de-jesus:v1'))
  await page.reload()
}

async function setStudyProgress(page, progress) {
  await page.goto('/')
  await page.evaluate((value) => {
    window.localStorage.setItem('santa-biblia-v2:study:la-fe-de-jesus:v1', JSON.stringify(value))
  }, progress)
}

test('the course index keeps its real route, progress and responsive lesson journey', async ({ page }, testInfo) => {
  await clearStudyProgress(page)
  await page.goto('/studies/la-fe-de-jesus')

  const hero = page.locator('section').filter({ has: page.getByRole('heading', { name: studyName }) }).first()
  await expect(hero).toBeVisible()
  await expect(hero.getByRole('link', { name: /Comenzar estudio|Start study|Começar estudo/ })).toHaveAttribute('href', '/studies/la-fe-de-jesus/quien-es-dios')
  await expect(page.getByText(/0 de 20 lecciones|0 of 20 lessons|0 de 20 lições/).first()).toBeVisible()
  await expect(page.getByText(/Siguiente paso: ¿Quién es Dios\?|Next step: Who is God\?|Próximo passo: Quem é Deus\?/).first()).toBeVisible()
  await expect(page.locator('ol > li')).toHaveCount(20)

  const firstLesson = page.locator('ol > li').nth(0)
  const secondLesson = page.locator('ol > li').nth(1)
  const firstBox = await firstLesson.boundingBox()
  const secondBox = await secondLesson.boundingBox()
  expect(firstBox).not.toBeNull()
  expect(secondBox).not.toBeNull()
  if (testInfo.project.name === 'desktop') {
    expect(Math.abs(firstBox.y - secondBox.y)).toBeLessThanOrEqual(2)
    expect(secondBox.x).toBeGreaterThan(firstBox.x)
  } else {
    expect(secondBox.y).toBeGreaterThan(firstBox.y)
  }

  await setStudyProgress(page, {
    version: 2,
    lastLessonSlug: 'la-santa-biblia',
    lastQuestionId: null,
    completedLessonSlugs: ['quien-es-dios'],
    courseCompletedAt: null,
    lessonProgress: {},
    updatedAt: Date.now(),
  })
  await page.goto('/studies/la-fe-de-jesus')
  await expect(page.getByRole('link', { name: /Continuar estudio|Continue study|Continuar estudo/ })).toHaveAttribute('href', '/studies/la-fe-de-jesus/la-santa-biblia')
  await expect(page.getByText(/1 de 20 lecciones|1 of 20 lessons|1 de 20 lições/).first()).toBeVisible()
  await expect(page.getByText(/Siguiente paso: La Santa Biblia|Next step: The Holy Bible|Próximo passo: A Santa Bíblia/).first()).toBeVisible()
})

test('a study lesson keeps the global navigation fixed on compact screens', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The compact global navigation is not rendered on desktop.')
  await clearStudyProgress(page)
  await page.goto('/studies/la-fe-de-jesus/quien-es-dios')
  await expect(page.getByRole('heading', { name: '¿Quién es Dios?', exact: true })).toBeVisible()

  const navigation = page.locator('.mobile-navigation')
  await expect(navigation).toBeVisible()
  await page.waitForTimeout(3400)
  await expect(navigation).toHaveCSS('visibility', 'visible')

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(navigation).toBeVisible()
  await page.waitForTimeout(3400)
  await expect(navigation).toBeVisible()
})

test('a study lesson follows the saved reading preferences', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.setItem('santa_biblia_v2_settings', JSON.stringify({
      bibleVersion: 'nbla', fontFamily: 'sans', locale: 'es', readerFontScale: 1.3, readerLineHeight: 'spacious', theme: 'light',
    }))
  })
  await page.goto('/studies/la-fe-de-jesus/quien-es-dios')
  await expect(page.getByRole('heading', { name: '¿Quién es Dios?', exact: true })).toBeVisible()

  const lessonPage = page.locator('[data-study-font]')
  await expect(lessonPage).toHaveAttribute('data-study-font', 'sans')
  await expect(lessonPage).toHaveAttribute('data-study-line-height', 'spacious')
  await expect(lessonPage.locator('details summary strong').first()).toHaveCSS('font-family', /Inter/)
})

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

  const quickTest = page.getByRole('region', { name: /Test rápido|Quick test|Teste rápido/ })
  await expect(quickTest).toBeVisible()
  await expect(firstQuestion.locator('form')).toHaveCount(0)

  const firstTest = page.locator('#test-q-01-01')
  await expect(firstTest).not.toHaveAttribute('open', '')
  await firstTest.locator('summary').click()
  await expect(firstTest).toHaveAttribute('open', '')
  const firstCheck = firstTest.locator('form')
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
  await page.locator('#test-q-01-01 summary').click()
  await expect(page.locator('#test-q-01-01 form').getByText(/Correcto|Correct|Correto/).first()).toBeVisible()

  const completeButton = page.getByRole('button', { name: /Marcar lección como completada|Mark lesson as completed|Marcar lição como concluída/ })
  await expect(completeButton).toBeDisabled()

  for (const questionId of ['q-01-02', 'q-01-04']) {
    const testItem = page.locator(`#test-${questionId}`)
    await testItem.locator('summary').click()
    const check = testItem.locator('form')
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
