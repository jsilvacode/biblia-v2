import { useLayoutEffect, useRef } from 'react'
import styles from './HomePage.module.css'

// Keep the responsive source contract shared with the document preload.
// One picture serves the opening in both the stacked and two-column layouts.
const desktopSizes = '(min-width: 2000px) 100vw, 2000px'

export function HomeLandscape() {
  const imageRef = useRef(null)

  useLayoutEffect(() => {
    // React creates img before attaching picture. Safari can eagerly fetch
    // its fallback at that point, even when an AVIF source was preloaded.
    // Assign fallback attributes only once all sources are in the document.
    const image = imageRef.current
    image.sizes = desktopSizes
    image.srcset = '/assets/home-landscape-v5-960.webp 960w, /assets/home-landscape-v5-1280.webp 1280w, /assets/home-landscape-v5-1672.webp 1672w'
    image.src = '/assets/home-landscape-v5-960.webp'
  }, [])

  return (
    <picture aria-hidden="true" className={styles.heroLandscape}>
      <source media="(max-width: 620px)" sizes="600px" srcSet="/assets/home-landscape-v5-mobile-480.avif 480w, /assets/home-landscape-v5-mobile-941.avif 941w" type="image/avif" />
      <source media="(max-width: 620px)" sizes="600px" srcSet="/assets/home-landscape-v5-mobile-480.webp 480w, /assets/home-landscape-v5-mobile-941.webp 941w" type="image/webp" />
      <source sizes={desktopSizes} srcSet="/assets/home-landscape-v5-960.avif 960w, /assets/home-landscape-v5-1280.avif 1280w, /assets/home-landscape-v5-1672.avif 1672w" type="image/avif" />
      <img alt="" decoding="async" fetchPriority="high" height="941" ref={imageRef} width="1672" />
    </picture>
  )
}
