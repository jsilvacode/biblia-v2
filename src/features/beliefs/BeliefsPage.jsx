import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EditorialIllustration } from '../../components/ui/EditorialIllustration'
import { Icon } from '../../components/ui/Icon'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { PassagePreviewProvider, PassageReferences } from '../topics/PassagePreview'
import { ReaderDialog } from '../reader/ReaderDialog'
import catalog from './beliefs.es.json'
import styles from './BeliefsPage.module.css'

const artwork = {
  dios: '/assets/editorial/beliefs/scriptures.webp',
  humanidad: '/assets/editorial/beliefs/creation.webp',
  salvacion: '/assets/editorial/beliefs/salvation.webp',
  iglesia: '/assets/editorial/beliefs/scriptures.webp',
  'vida-cristiana': '/assets/editorial/beliefs/creation.webp',
  restauracion: '/assets/editorial/beliefs/creation.webp',
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

function BeliefsContent() {
  const { locale } = useI18n()
  const { slug } = useParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
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
  const [initialBatch, setInitialBatch] = useState(() => window.matchMedia('(max-width: 620px)').matches ? 3 : 9)
  const [visibleCount, setVisibleCount] = useState(initialBatch)
  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 620px)')
    const updateInitialBatch = () => setInitialBatch(mobileViewport.matches ? 3 : 9)
    mobileViewport.addEventListener('change', updateInitialBatch)
    return () => mobileViewport.removeEventListener('change', updateInitialBatch)
  }, [])
  useEffect(() => { setVisibleCount(initialBatch) }, [category, initialBatch, query])
  const visibleBeliefs = filtered.slice(0, visibleCount)

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
        <section aria-labelledby="belief-references-title" className={styles.references}>
          <header className={styles.sectionHeading}><h2 id="belief-references-title">Su fundamento en la Biblia</h2><p>Abre un pasaje para leerlo en el lector de Santa Biblia.</p></header>
          <PassageReferences references={belief.references.map((reference) => reference.label)} title={belief.title} />
        </section>
        <p className={styles.sourceLink}><a href={belief.source.officialSpanishWebUrl} rel="noreferrer" target="_blank">Ver declaración oficial en la División Sudamericana ↗</a></p>
        <div className={styles.notesFooter}><button aria-haspopup="dialog" onClick={openNotes} type="button">Notas sobre la versión <Icon name="arrowRight" size={16} /></button></div>
      </article>
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
        <label className={styles.searchField}><Icon name="search" size={19} /><input aria-label="Buscar creencias" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, tema o pasaje bíblico" type="search" value={query} /></label>
      </div>
      <div aria-label="Filtrar por tema" className={styles.categories} role="group">
        <button aria-pressed={category === 'all'} onClick={() => setCategory('all')} type="button">Todas <span>28</span></button>
        {catalog.categories.map((item) => <button aria-pressed={category === item.id} key={item.id} onClick={() => setCategory(item.id)} type="button">{categoryNames[item.id]} <span>{item.beliefNumbers.length}</span></button>)}
      </div>
      <p aria-live="polite" className={styles.resultsCount} role="status">Mostrando {visibleBeliefs.length} de {filtered.length} {filtered.length === 1 ? 'creencia' : 'creencias'}</p>
      {visibleBeliefs.length ? <>
        <div className={styles.beliefGrid} id="belief-grid">
          {visibleBeliefs.map((item) => <Link aria-label={item.number + '. ' + item.title + ': leer creencia'} className={styles.beliefCard} key={item.id} to={'/beliefs/' + item.slug}>
            <span aria-hidden="true" className={styles.cardArt + ' editorial-art'}><EditorialIllustration alt="" decoding="async" height="1024" loading="lazy" src={artwork[item.categoryId]} width="1536" /><span className={styles.cardNumber}>{String(item.number).padStart(2, '0')}</span></span>
            <span className={styles.cardCopy}><span className={styles.cardCategory}>{categoryNames[item.categoryId]}</span><strong className={styles.cardTitle}>{item.title}</strong><span className={styles.cardExcerpt}>{excerpt(item.paragraphs[0])}</span><span className={styles.cardFooter}><span>{item.references.length} pasajes bíblicos</span><span>Leer creencia <Icon name="arrowRight" size={16} /></span></span></span>
          </Link>)}
        </div>
        {visibleBeliefs.length < filtered.length && <button aria-controls="belief-grid" className={styles.loadMore} onClick={() => setVisibleCount((count) => Math.min(count + 9, filtered.length))} type="button">
          Mostrar {Math.min(9, filtered.length - visibleBeliefs.length)} {filtered.length - visibleBeliefs.length === 1 ? 'creencia' : 'creencias'} más <Icon name="chevronDown" size={17} />
        </button>}
      </> : <div className={styles.emptyState}><p>No encontramos una creencia para esa búsqueda.</p><button className={styles.clearButton} onClick={() => { setQuery(''); setCategory('all') }} type="button">Limpiar búsqueda</button></div>}
    </section>
    <div className={styles.notesFooter}><button aria-haspopup="dialog" onClick={openNotes} type="button">Notas sobre la versión <Icon name="arrowRight" size={16} /></button></div>
    {notesDialog}
  </div>
}

export default function BeliefsPage() {
  return <PassagePreviewProvider versionId="rva2015"><BeliefsContent /></PassagePreviewProvider>
}
