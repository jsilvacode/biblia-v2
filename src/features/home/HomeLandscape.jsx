import { useLayoutEffect, useRef } from 'react'
import styles from './HomePage.module.css'

// Covering both sections makes this landscape wider than the viewport
// before it is cropped. Request enough pixels for that painted width.
const desktopSizes = '(min-width: 2400px) 100vw, 2400px'

export function HomeLandscape() {
  const imageRef = useRef(null)

  useLayoutEffect(() => {
    // React creates img before attaching picture. Safari can eagerly fetch
    // its fallback at that point, even when an AVIF source was preloaded.
    // Assign fallback attributes only once all sources are in the document.
    const image = imageRef.current
    image.sizes = desktopSizes
    image.srcset = '/assets/home-landscape-v3-1600.webp 1600w, /assets/home-landscape-v3-2400.webp 2400w, /assets/home-landscape-v3-3200.webp 3200w'
    image.src = '/assets/home-landscape-v3-1600.webp'
  }, [])

  return (
    <picture aria-hidden="true" className={styles.heroLandscape}>
      <source media="(max-width: 620px)" sizes="600px" srcSet="/assets/home-landscape-v3-mobile-800.avif 800w, /assets/home-landscape-v3-mobile-1200.avif 1200w" type="image/avif" />
      <source media="(max-width: 620px)" sizes="600px" srcSet="/assets/home-landscape-v3-mobile-800.webp 800w, /assets/home-landscape-v3-mobile-1200.webp 1200w" type="image/webp" />
      <source sizes={desktopSizes} srcSet="/assets/home-landscape-v3-1600.avif 1600w, /assets/home-landscape-v3-2400.avif 2400w, /assets/home-landscape-v3-3200.avif 3200w" type="image/avif" />
      <img alt="" decoding="async" fetchPriority="high" height="1633" ref={imageRef} width="3200" />
    </picture>
  )
}
