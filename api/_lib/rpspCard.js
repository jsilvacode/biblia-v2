import React from 'react'
import { truncateShareText } from './shareMetadata.js'

const element = React.createElement
const ink = '#294953'
const muted = '#607477'

function icon(name, size = 24, color = ink) {
  const paths = {
    book: 'M12 7c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V6c-3-1-6-1-9 1Zm0 0v14',
    headphones: 'M4 14v-3a8 8 0 0 1 16 0v3M4 13H3v7h4v-7H4Zm16 0h1v7h-4v-7h3Z',
    repeat: 'm17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3',
    back: 'm11 7-6 5 6 5V7Zm9 0-6 5 6 5V7Z',
    forward: 'm4 7 6 5-6 5V7Zm9 0 6 5-6 5V7Z',
    volume: 'm11 5-6 4H2v6h3l6 4V5Zm5 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12',
  }
  return element('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' },
    element('path', { d: paths[name] }),
  )
}

function control(name) {
  return element('div', { style: { alignItems: 'center', background: '#f8f8f3', border: '1px solid #d0d8d5', borderRadius: 999, display: 'flex', height: 42, justifyContent: 'center', width: 42 } }, icon(name, 22))
}

function durationLabel(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Audio'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

/** A static social preview of the same reflection, never an embedded player. */
export function createRpspCard(metadata, backgroundImage) {
  const rawTitle = String(metadata.episodeTitle ?? '').split('|').map((part) => part.trim()).find(Boolean)
  const title = truncateShareText(rawTitle || metadata.reference, 118)
  const titleSize = title.length > 70 ? 29 : 34

  return element('div', { style: { background: '#f5f4ec', color: ink, display: 'flex', height: '100%', overflow: 'hidden', position: 'relative', width: '100%' } },
    backgroundImage && element('img', { src: backgroundImage, alt: '', style: { height: '100%', left: 0, objectFit: 'cover', position: 'absolute', top: 0, width: '100%' } }),
    element('div', { style: { background: 'linear-gradient(90deg, rgba(247,247,240,.97) 0%, rgba(247,247,240,.91) 54%, rgba(247,247,240,.63) 100%)', display: 'flex', height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' } }),
    element('div', { style: { boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100%', padding: '35px 62px 29px', position: 'relative', width: '100%' } },
      element('div', { style: { alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'space-between' } },
        element('div', { style: { alignItems: 'center', display: 'flex', fontSize: 25, fontWeight: 600, gap: 12 } }, icon('book', 29), 'Santa Biblia'),
        element('div', { style: { alignItems: 'center', color: muted, display: 'flex', fontSize: 17, gap: 9, letterSpacing: '1.1px' } }, icon('headphones', 22, muted), 'REFLEXIÓN EN AUDIO'),
      ),
      element('div', { style: { color: muted, display: 'flex', fontSize: 20, letterSpacing: '2px', marginTop: 25 } }, 'REAVIVADOS POR SU PALABRA'),
      element('div', { style: { alignItems: 'baseline', display: 'flex', gap: 25, marginTop: 4 } },
        element('div', { style: { display: 'flex', fontSize: 51, fontWeight: 600, letterSpacing: '-1.6px', lineHeight: 1.2 } }, metadata.reference),
        element('div', { style: { color: muted, display: 'flex', fontSize: 23 } }, metadata.dateLabel),
      ),
      element('div', { style: { background: 'rgba(252,252,247,.96)', border: '1px solid rgba(95,119,119,.34)', borderRadius: 27, boxShadow: '0 18px 38px rgba(54,70,66,.12)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', marginTop: 24, padding: '24px 30px 23px', width: '100%' } },
        element('div', { style: { alignItems: 'center', display: 'flex', fontSize: titleSize, fontWeight: 600, height: 84, letterSpacing: '-.6px', lineHeight: 1.17, overflow: 'hidden', width: '100%' } }, title),
        element('div', { style: { alignItems: 'center', display: 'flex', gap: 23, justifyContent: 'center', marginTop: 4 } },
          control('repeat'), control('back'),
          element('div', { style: { alignItems: 'center', background: '#365d68', border: '7px solid #e8eeea', borderRadius: 999, display: 'flex', height: 82, justifyContent: 'center', width: 82 } },
            element('svg', { width: 30, height: 32, viewBox: '0 0 30 32' }, element('path', { d: 'M7 4 27 16 7 28Z', fill: '#fffdf6' })),
          ),
          control('forward'), control('volume'),
        ),
        element('div', { style: { alignItems: 'center', color: muted, display: 'flex', fontSize: 17, gap: 16, marginTop: 16, width: '100%' } },
          element('div', { style: { display: 'flex', width: 45 } }, '0:00'),
          element('div', { style: { alignItems: 'center', background: '#d7e0db', borderRadius: 999, display: 'flex', flex: 1, height: 5 } },
            element('div', { style: { background: '#365d68', border: '3px solid #f9faf5', borderRadius: 999, display: 'flex', height: 17, width: 17 } }),
          ),
          element('div', { style: { display: 'flex', justifyContent: 'flex-end', minWidth: 47 } }, durationLabel(metadata.audioDurationSeconds)),
        ),
      ),
      element('div', { style: { alignItems: 'center', color: muted, display: 'flex', fontSize: 17, justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14, width: '100%' } },
        element('div', { style: { display: 'flex' } }, 'Audio de Nuevo Tiempo'),
        element('div', { style: { display: 'flex' } }, 'santabiblia.cloud'),
      ),
    ),
  )
}
