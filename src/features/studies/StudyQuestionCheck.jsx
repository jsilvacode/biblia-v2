import { useId, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import styles from './Studies.module.css'

export function StudyQuestionCheck({ checkpoint, initialCorrectOptionId, onCorrect }) {
  const { t } = useI18n()
  const groupId = useId()
  const [selectedOptionId, setSelectedOptionId] = useState(initialCorrectOptionId ?? '')
  const [result, setResult] = useState(initialCorrectOptionId ? 'correct' : null)
  const selectedOption = checkpoint.options.find((option) => option.id === selectedOptionId)

  function handleChange(optionId) {
    setSelectedOptionId(optionId)
    setResult(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!selectedOption) return
    const nextResult = selectedOptionId === checkpoint.correctOptionId ? 'correct' : 'incorrect'
    setResult(nextResult)
    if (nextResult === 'correct') onCorrect(checkpoint.id, selectedOptionId)
  }

  return (
    <form className={styles.questionCheck} id={`check-${checkpoint.id}`} onSubmit={handleSubmit}>
      <fieldset>
        <legend tabIndex={-1}>{checkpoint.prompt}</legend>
        <p className={styles.checkHint}>{t('studies.chooseAnswer')}</p>
        <div className={styles.answerOptions}>
          {checkpoint.options.map((option) => {
            const isSelected = selectedOptionId === option.id
            const resultClass = result && isSelected ? styles[result] : ''
            return (
              <label className={`${styles.answerOption} ${resultClass}`} key={option.id}>
                <input
                  checked={isSelected}
                  name={`${groupId}-${checkpoint.id}`}
                  onChange={() => handleChange(option.id)}
                  type="radio"
                  value={option.id}
                />
                <span>{option.text}</span>
                {result && isSelected && (
                  <span className={styles.answerState}>
                    <Icon name={result === 'correct' ? 'checkCircle' : 'circleAlert'} size={17} />
                    {t(`studies.${result}`)}
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>
      <button className={styles.checkAnswer} disabled={!selectedOptionId} type="submit">
        {t('studies.checkAnswer')}
      </button>
      <div aria-live="polite" className={styles.answerFeedback} role="status">
        {result && selectedOption && (
          <p>
            <strong>{t(`studies.${result}`)}.</strong>{' '}
            {selectedOption.feedback}
            {result === 'incorrect' && ` ${t('studies.tryAgain')}`}
          </p>
        )}
      </div>
    </form>
  )
}
