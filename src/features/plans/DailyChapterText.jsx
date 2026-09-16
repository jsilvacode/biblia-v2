import styles from './DailyReadingPage.module.css'

function validHeading(value) {
  const heading = String(value ?? '').replace(/\s+/g, ' ').trim()
  return heading && !/^[,.:;)}\]]/u.test(heading) ? heading : null
}

export function DailyChapterText({ chapter, onVerseVisible }) {
  return (
    <div className={styles.chapterText}>
      {chapter.map((item) => {
        const heading = validHeading(item.heading)
        return (
          <section className={styles.verseBlock} key={item.verse}>
            {heading && <h2>{heading}</h2>}
            <p
              data-rpsp-verse={item.verse}
              id={`rpsp-verse-${item.verse}`}
              ref={(element) => {
                if (element) onVerseVisible?.(element, item.verse)
              }}
            >
              <sup>{item.verse}</sup>
              <span>{item.text}</span>
            </p>
          </section>
        )
      })}
    </div>
  )
}
