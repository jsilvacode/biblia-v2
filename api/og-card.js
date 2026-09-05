import React from 'react'
import { ImageResponse } from '@vercel/og'
import {
  createAppShareMetadata,
  getRequestOrigin,
  loadVerseShareMetadata,
  truncateShareText,
} from './_lib/shareMetadata.js'

export const config = { runtime: 'edge' }

const element = React.createElement
const BACKGROUND_IMAGE_PATH = '/assets/social/verse-card-background.jpg?v=1'

function getQuoteTypography(length) {
  if (length <= 70) return { fontSize: 67, lineHeight: 1.08, maxWidth: 1050 }
  if (length <= 125) return { fontSize: 58, lineHeight: 1.1, maxWidth: 1060 }
  if (length <= 185) return { fontSize: 50, lineHeight: 1.12, maxWidth: 1070 }
  if (length <= 245) return { fontSize: 44, lineHeight: 1.13, maxWidth: 1080 }
  return { fontSize: 40, lineHeight: 1.14, maxWidth: 1090 }
}

async function loadBackgroundImage(origin) {
  try {
    const response = await fetch(new URL(BACKGROUND_IMAGE_PATH, origin))
    if (!response.ok) return null
    return response.arrayBuffer()
  } catch {
    return null
  }
}

function createCard(metadata, backgroundImage) {
  const isVerse = metadata.type === 'article'
  const quote = truncateShareText(metadata.text, isVerse ? 300 : 210)
  const typography = getQuoteTypography(quote.length)

  return element(
    'div',
    {
      style: {
        alignItems: 'stretch',
        background: 'linear-gradient(135deg, #191310 0%, #332219 100%)',
        color: '#fffaf2',
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      },
    },
    backgroundImage && element('img', {
      alt: '',
      src: backgroundImage,
      style: {
        display: 'flex',
        height: '100%',
        left: 0,
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        width: '100%',
      },
    }),
    element('div', {
      style: {
        background: 'linear-gradient(90deg, rgba(18,13,11,.94) 0%, rgba(23,16,13,.85) 34%, rgba(28,19,15,.58) 64%, rgba(30,20,15,.13) 100%)',
        display: 'flex',
        height: '100%',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%',
      },
    }),
    element('div', {
      style: {
        background: 'linear-gradient(0deg, rgba(12,8,7,.58) 0%, rgba(12,8,7,.14) 34%, transparent 60%)',
        bottom: 0,
        display: 'flex',
        height: '62%',
        left: 0,
        position: 'absolute',
        width: '100%',
      },
    }),
    element(
      'div',
      {
        style: {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '49px 62px 45px',
          position: 'relative',
          width: '100%',
        },
      },
      element(
        'div',
        { style: { alignItems: 'center', display: 'flex', gap: 16 } },
        element('div', {
          style: {
            background: '#f0ab7b',
            borderRadius: 999,
            display: 'flex',
            height: 3,
            width: 38,
          },
        }),
        element('div', {
          style: {
            color: '#fff7ee',
            display: 'flex',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '.25px',
          },
        }, 'Santa Biblia'),
      ),
      element(
        'div',
        {
          style: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            paddingBottom: 9,
            paddingTop: 8,
          },
        },
        element('div', {
          style: {
            color: '#fffaf2',
            display: 'flex',
            fontSize: typography.fontSize,
            fontWeight: 500,
            letterSpacing: '-.95px',
            lineHeight: typography.lineHeight,
            maxWidth: typography.maxWidth,
            textShadow: '0 2px 18px rgba(8,5,4,.76)',
          },
        }, `“${quote}”`),
        element('div', {
          style: {
            color: '#f4ba91',
            display: 'flex',
            fontSize: 23,
            fontWeight: 600,
            letterSpacing: '1.75px',
            marginTop: 22,
            textTransform: 'uppercase',
          },
        }, metadata.citation),
      ),
      element('div', {
        style: {
          color: 'rgba(255,248,239,.78)',
          display: 'flex',
          fontSize: 19,
          fontWeight: 500,
          letterSpacing: '.75px',
        },
      }, 'Lee · Medita · Comparte'),
    ),
  )
}

export default async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, {
      headers: { Allow: 'GET, HEAD' },
      status: 405,
    })
  }

  const origin = getRequestOrigin(request)
  const query = Object.fromEntries(new URL(request.url).searchParams.entries())
  let metadata = createAppShareMetadata(origin)

  if (query.type === 'verse') {
    try {
      metadata = await loadVerseShareMetadata({ origin, query })
    } catch {
      metadata = createAppShareMetadata(origin)
    }
  }

  const backgroundImage = await loadBackgroundImage(origin)

  return new ImageResponse(createCard(metadata, backgroundImage), {
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'public, max-age=31536000, immutable',
      'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
    },
    width: 1200,
  })
}
