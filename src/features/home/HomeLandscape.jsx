import { useLayoutEffect, useRef } from 'react'
import styles from './HomePage.module.css'

const desktopSizes = '(max-width: 800px) 1200px, 100vw'

export function HomeLandscape() {
  const imageRef = useRef(null)

  useLayoutEffect(() => {
    // React creates img before attaching picture. Safari can eagerly fetch
    // its fallback at that point, even when an AVIF source was preloaded.
    // Assign fallback attributes only once all sources are in the document.
    const image = imageRef.current
    image.sizes = desktopSizes
    image.srcset = '/assets/home-landscape-v2-1600.webp 1600w, /assets/home-landscape-v2-2400.webp 2400w, /assets/home-landscape-v2-2988.webp 2988w'
    image.src = '/assets/home-landscape-v2-1600.webp'
  }, [])

  return (
    <picture aria-hidden="true" className={styles.heroLandscape}>
      <source media="(max-width: 620px)" sizes="800px" srcSet="/assets/home-landscape-v2-mobile-800.avif 800w, /assets/home-landscape-v2-mobile-1200.avif 1200w" type="image/avif" />
      <source media="(max-width: 620px)" sizes="800px" srcSet="/assets/home-landscape-v2-mobile-800.webp 800w, /assets/home-landscape-v2-mobile-1200.webp 1200w" type="image/webp" />
      <source sizes={desktopSizes} srcSet="/assets/home-landscape-v2-1600.avif 1600w, /assets/home-landscape-v2-2400.avif 2400w, /assets/home-landscape-v2-2988.avif 2988w" type="image/avif" />
      <img alt="" decoding="async" fetchPriority="high" height="2988" ref={imageRef} width="2988" />
    </picture>
  )
}
