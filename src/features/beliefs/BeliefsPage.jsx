import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EditorialIllustration } from '../../components/ui/EditorialIllustration'
import { Icon } from '../../components/ui/Icon'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { PassagePreviewProvider, usePassagePreview } from '../topics/PassagePreview'
import { ReaderDialog } from '../reader/ReaderDialog'
import catalog from './beliefs.es.json'
import styles from './BeliefsPage.module.css'

const artwork = {
  dios: '/assets/editorial/beliefs/scriptures.webp',
  humanidad: '/assets/editorial/beliefs/creation.webp',
  salvacion: '/assets/editorial/beliefs/salvation.webp',
  iglesia: '/assets/editorial/beliefs/church-v1.webp',
  'vida-cristiana': '/assets/editorial/beliefs/christian-life-v1.webp',
  restauracion: '/assets/editorial/beliefs/restoration-v1.webp',
}
const categoryNames = {
  dios: 'Dios',
  humanidad: 'La humanidad',
  salvacion: 'La salvación',
  iglesia: 'La iglesia',
  'vida-cristiana': 'La vida cristiana',
  restauracion: 'La restauración',
}

function excerpt(text, limit = 180) {
  if (text.length <= limit) return text
  const end = text.lastIndexOf(' ', limit)
  return text.slice(0, end > limit * 0.72 ? end : limit).trimEnd() + '…'
}

function OfficialReferences({ references, title }) {
  const openPassage = usePassagePreview()
  const groups = []
  references.forEach((reference) => {
    const previous = groups.at(-1)
    if (previous?.source === reference.sourceGroup && previous.references[0].bookId === reference.bookId) {
      previous.references.push(reference)
    } else {
      groups.push({ source: reference.sourceGroup || reference.label, references: [reference] })
    }
  })
  return <p className={styles.officialCitations}>
    {groups.map((group, index) => <span key={`${index}-${group.source}`}>
      <button
        aria-haspopup="dialog"
        aria-label={`Abrir referencias bíblicas: ${group.references.map((reference) => reference.label).join('; ')}`}
        onClick={(event) => openPassage({ references: group.references, title }, event.currentTarget)}
        type="button"
      >{group.source}</button>
      {index < groups.length - 1 && <span className={styles.referenceSeparator}>; </span>}
    </span>)}
  </p>
}

function ExpandedBelief({ beliefNumber, title }) {
  const [expanded, setExpanded] = useState(false)
  const [chapter, setChapter] = useState(null)
  const [status, setStatus] = useState('idle')
  const [attempt, setAttempt] = useState(0)
  const openPassage = usePassagePreview()
  const chapterId = String(beliefNumber).padStart(2, '0')

  useEffect(() => {
    if (!expanded || chapter) return undefined
    const controller = new AbortController()
    fetch(`/data/beliefs/chapters/${chapterId}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Chapter request failed: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setChapter(data)
          setStatus('ready')
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== 'AbortError') setStatus('error')
      })
    return () => controller.abort()
  }, [attempt, chapter, chapterId, expanded])

  function renderParagraph(block, blockIndex, references) {
    if (!block.citations?.length) return block.text
    const children = []
    let cursor = 0
    block.citations.forEach((citation, citationIndex) => {
      const sourceText = block.text.slice(citation.start, citation.end)
      const citedReferences = citation.referenceIds.map((id) => references.get(id)).filter(Boolean)
      children.push(block.text.slice(cursor, citation.start))
      if (citedReferences.length) {
        const labels = citedReferences.map((reference) => reference.label)
        children.push(
          <button
            aria-haspopup="dialog"
            aria-label={`Abrir referencias bíblicas: ${labels.join('; ')}`}
            className={styles.inlineCitation}
            key={`${blockIndex}-${citationIndex}`}
            onClick={(event) => openPassage({ references: citedReferences, title }, event.currentTarget)}
            type="button"
          >
            {sourceText}
          </button>,
        )
      } else {
        children.push(sourceText)
      }
      cursor = citation.end
    })
    children.push(block.text.slice(cursor))
    return children
  }

  const pageCount = chapter ? chapter.printedPages[1] - chapter.printedPages[0] + 1 : null
  const references = new Map((chapter?.references ?? []).map((reference) => [reference.id, reference]))

  return (
    <section aria-label={`Exposición ampliada: ${title}`} className={styles.expansion}>
      <button
        aria-busy={status === 'loading'}
        aria-controls={`belief-expansion-${beliefNumber}`}
        aria-expanded={expanded}
        className={styles.expansionToggle}
        onClick={() => {
          if (!chapter) setStatus(expanded ? 'idle' : 'loading')
          setExpanded((value) => !value)
        }}
        type="button"
      >
        <span>
          <span className={styles.expansionEyebrow}>Exposición ampliada</span>
          <strong>{expanded ? 'Ocultar exposición completa' : 'Leer la exposición completa'}</strong>
        </span>
        <span className={styles.expansionToggleMeta}>
          {pageCount ? `${pageCount} páginas impresas` : 'Edición 2007'}
          <Icon name="chevronDown" size={17} />
        </span>
      </button>
      {expanded && (
        <div className={styles.expansionContent} id={`belief-expansion-${beliefNumber}`}>
          {status === 'loading' && <p className={styles.expansionStatus} role="status">Cargando la exposición…</p>}
          {status === 'error' && (
            <div className={styles.expansionError} role="alert">
              <p>No se pudo cargar el texto de esta creencia.</p>
              <button onClick={() => {
                setStatus('loading')
                setAttempt((value) => value + 1)
              }} type="button">Intentar de nuevo</button>
            </div>
          )}
          {chapter && (
            <>
              <header className={styles.expansionHeader}>
                <div><p className={styles.expansionEyebrow}>Lectura ampliada</p><h2>{chapter.bookChapterTitle}</h2></div>
                <small>Edición 2007 · págs. {chapter.printedPages[0]}–{chapter.printedPages[1]}</small>
              </header>
              <div className={styles.expandedText}>
                {chapter.blocks.map((block, index) => {
                  if (block.kind === 'heading') return <h3 key={`${block.pdfPage}-${index}`}>{block.text}</h3>
                  if (block.kind === 'figure') {
                    return <figure className={styles.diagram} key={`${block.pdfPage}-${index}`}>
                      <figcaption><strong>{block.title}</strong><span>{block.text}</span></figcaption>
                    </figure>
                  }
                  return <p key={`${block.pdfPage}-${index}`}>{renderParagraph(block, index, references)}</p>
                })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function BeliefsContent() {
  const { locale } = useI18n()
  const { slug } = useParams()
  const [{ query, category, visibleCount }, setExplorer] = useState(() => {
    const initialBatch = window.matchMedia('(max-width: 620px)').matches ? 3 : 9
    return { query: '', category: 'all', initialBatch, visibleCount: initialBatch }
  })
  const [notesOpen, setNotesOpen] = useState(false)
  const notesTriggerRef = useRef(null)
  const belief = slug ? catalog.beliefs.find((item) => item.slug === slug) : null
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return catalog.beliefs.filter((item) => {
      if (category !== 'all' && item.categoryId !== category) return false
      if (!normalized) return true
      const text = (item.number + ' ' + item.title + ' ' + item.paragraphs.join(' ') + ' ' + item.references.map((ref) => ref.label).join(' '))
        .toLocaleLowerCase(locale).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return text.includes(normalized)
    })
  }, [category, locale, query])
  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 620px)')
    const updateInitialBatch = () => {
      const initialBatch = mobileViewport.matches ? 3 : 9
      setExplorer((current) => current.initialBatch === initialBatch ? current
        : { ...current, initialBatch, visibleCount: initialBatch })
    }
    mobileViewport.addEventListener('change', updateInitialBatch)
    return () => mobileViewport.removeEventListener('change', updateInitialBatch)
  }, [])
  const visibleBeliefs = filtered.slice(0, visibleCount)

  function setFilters(updates) {
    setExplorer((current) => {
      const next = { ...current, ...updates }
      return next.query === current.query && next.category === current.category ? current
        : { ...next, visibleCount: current.initialBatch }
    })
  }

  function openNotes(event) {
    notesTriggerRef.current = event.currentTarget
    setNotesOpen(true)
  }

  const notice = (
    <aside aria-label="Aviso sobre este recurso" className={styles.notice}>
      <p>Este material es un recurso de estudio independiente y no representa un sitio oficial de la Iglesia Adventista del Séptimo Día. Para más detalles sobre el texto que se presenta a continuación, consulta las <button aria-haspopup="dialog" onClick={openNotes} type="button">Notas sobre la versión</button>.</p>
    </aside>
  )
  const notesDialog = (
    <ReaderDialog className={styles.notesDialog} closeLabel="Cerrar notas sobre la versión" isOpen={notesOpen}
      onClose={() => setNotesOpen(false)} returnFocusRef={notesTriggerRef} title="Notas sobre la versión">
      <div className={styles.notesBody}>
        <p>Las declaraciones breves de las 28 creencias fundamentales de los adventistas del séptimo día están basadas en el texto oficial de la <a href="https://institucional.adventistas.org/es/nuestras-crencias/" rel="noreferrer" target="_blank">División Sudamericana</a>.</p>
        <section>
          <h3>Exposición ampliada</h3>
          <p>La ampliación de cada tema corresponde al libro <em>Creencias de los Adventistas del Séptimo Día: Una exposición bíblica de las doctrinas fundamentales</em>, de la Asociación Ministerial de la Asociación General de la Iglesia Adventista del Séptimo Día (2006).</p>
          <p>Título original: <em>Seventh-day Adventists Believe</em>. Traducción: Armando Collins y Miguel A. Valdivia. Diagramación de interiores y tapa: Publicaciones Interamericanas. Edición en español: Asociación Casa Editora Sudamericana (ACES), 2007.</p>
          <p><a href="https://assets.adventistconnect.org/angelesv/2026/01/26073640/28-Creencias-Fundamentales.pdf" rel="noreferrer" target="_blank">Consultar la edición digital de 2007 ↗</a></p>
        </section>
        <section>
          <h3>Referencias bíblicas</h3>
          <p>Las citas bíblicas identificadas se abren en el lector modal de <a href="https://www.santabiblia.cloud">www.santabiblia.cloud</a>, en la versión Reina-Valera Actualizada 2015.</p>
        </section>
        <p className={styles.rights}>© Asociación Ministerial de la Asociación General de la Iglesia Adventista del Séptimo Día, 2006; © ACES, 2007.</p>
        <p>Este material es un recurso de estudio independiente y no representa un sitio oficial de la Iglesia Adventista del Séptimo Día.</p>
      </div>
    </ReaderDialog>
  )

  if (slug && !belief) {
    return <div className={'page ' + styles.page}>
      <PageIntro eyebrow="Un recorrido de estudio" title="28 creencias fundamentales">No encontramos esta creencia.</PageIntro>
      <Link className={styles.backLink} to="/beliefs"><Icon name="arrowLeft" size={17} />Volver a las 28 creencias</Link>
    </div>
  }

  if (belief) {
    const index = catalog.beliefs.findIndex((item) => item.slug === belief.slug)
    const previous = catalog.beliefs[index - 1]
    const next = catalog.beliefs[index + 1]
    return <div className={'page ' + styles.page}>
      <PageIntro eyebrow={categoryNames[belief.categoryId]} illustration={{ height: 1024, src: artwork[belief.categoryId], width: 1536 }} title={belief.title}>
        Declaración oficial · División Sudamericana
      </PageIntro>
      <article className={styles.article}>
        <div className={styles.articleMeta}><span>{String(belief.number).padStart(2, '0')}</span><span>Declaración oficial</span></div>
        <div className={styles.statement}>{belief.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <section aria-label="Referencias bíblicas de la declaración oficial" className={styles.references}>
          <OfficialReferences references={belief.references} title={belief.title} />
        </section>
        <p className={styles.sourceLink}><a href={belief.source.officialSpanishWebUrl} rel="noreferrer" target="_blank">Ver declaración oficial en la División Sudamericana ↗</a></p>
      </article>
      <ExpandedBelief beliefNumber={belief.number} key={belief.number} title={belief.title} />
      <div className={styles.notesFooter}><button aria-haspopup="dialog" onClick={openNotes} type="button">Notas sobre la versión <Icon name="arrowRight" size={16} /></button></div>
      <nav aria-label="Recorrer las 28 creencias" className={styles.pager}>
        {previous ? <Link to={'/beliefs/' + previous.slug}><Icon name="arrowLeft" size={16} /><span><small>Creencia anterior</small><strong>{previous.title}</strong></span></Link>
          : <Link to="/beliefs"><Icon name="arrowLeft" size={16} /><span><small>El recorrido completo</small><strong>Las 28 creencias</strong></span></Link>}
        {next && <Link className={styles.nextLink} to={'/beliefs/' + next.slug}><span><small>Creencia siguiente</small><strong>{next.title}</strong></span><Icon name="arrowRight" size={16} /></Link>}
      </nav>
      {notesDialog}
    </div>
  }

  return <div className={'page ' + styles.page}>
    <PageIntro eyebrow="Un recorrido de estudio" illustration={{ height: 1024, src: '/assets/editorial/bible-library-v1.webp', width: 1536 }}
      title="28 creencias fundamentales">
      Una fe para vivir cada día. Explora las enseñanzas bíblicas que compartimos los adventistas del séptimo día.
    </PageIntro>
    {locale !== 'es' && <p className={styles.contentLanguage}>El contenido de este recurso está disponible en español.</p>}
    {notice}
    <section aria-labelledby="belief-list-heading" className={styles.explorer}>
      <div className={styles.explorerHeading}>
        <div><p className="eyebrow">Un recorrido por nuestra fe</p><h2 id="belief-list-heading">Encuentra un tema para explorar.</h2></div>
        <label className={styles.searchField}><Icon name="search" size={19} /><input aria-label="Buscar creencias" onChange={(event) => setFilters({ query: event.target.value })} placeholder="Buscar por título, tema o pasaje bíblico" type="search" value={query} /></label>
      </div>
      <div aria-label="Filtrar por tema" className={styles.categories} role="group">
        <button aria-pressed={category === 'all'} onClick={() => setFilters({ category: 'all' })} type="button">Todas <span>28</span></button>
        {catalog.categories.map((item) => <button aria-pressed={category === item.id} key={item.id} onClick={() => setFilters({ category: item.id })} type="button">{categoryNames[item.id]} <span>{item.beliefNumbers.length}</span></button>)}
      </div>
      <p aria-live="polite" className={styles.resultsCount} role="status">Mostrando {visibleBeliefs.length} de {filtered.length} {filtered.length === 1 ? 'creencia' : 'creencias'}</p>
      {visibleBeliefs.length ? <>
        <div className={styles.beliefGrid} id="belief-grid">
          {visibleBeliefs.map((item) => <Link aria-label={item.number + '. ' + item.title + ': leer creencia'} className={styles.beliefCard} key={item.id} to={'/beliefs/' + item.slug}>
            <span aria-hidden="true" className={styles.cardArt + ' editorial-art'}><EditorialIllustration alt="" decoding="async" height="1024" loading="lazy" src={artwork[item.categoryId]} width="1536" /><span className={styles.cardNumber}>{String(item.number).padStart(2, '0')}</span></span>
            <span className={styles.cardCopy}><span className={styles.cardCategory}>{categoryNames[item.categoryId]}</span><strong className={styles.cardTitle}>{item.title}</strong><span className={styles.cardExcerpt}>{excerpt(item.paragraphs[0])}</span><span className={styles.cardFooter}><span>{item.references.length} pasajes bíblicos</span><span>Leer creencia <Icon name="arrowRight" size={16} /></span></span></span>
          </Link>)}
        </div>
        {visibleBeliefs.length < filtered.length && <button aria-controls="belief-grid" className={styles.loadMore} onClick={() => setExplorer((current) => ({ ...current, visibleCount: Math.min(current.visibleCount + 9, filtered.length) }))} type="button">
          Mostrar {Math.min(9, filtered.length - visibleBeliefs.length)} {filtered.length - visibleBeliefs.length === 1 ? 'creencia' : 'creencias'} más <Icon name="chevronDown" size={17} />
        </button>}
      </> : <div className={styles.emptyState}><p>No encontramos una creencia para esa búsqueda.</p><button className={styles.clearButton} onClick={() => setFilters({ query: '', category: 'all' })} type="button">Limpiar búsqueda</button></div>}
    </section>
    <div className={styles.notesFooter}><button aria-haspopup="dialog" onClick={openNotes} type="button">Notas sobre la versión <Icon name="arrowRight" size={16} /></button></div>
    {notesDialog}
  </div>
}

export default function BeliefsPage() {
  return <PassagePreviewProvider versionId="rva2015"><BeliefsContent /></PassagePreviewProvider>
}
