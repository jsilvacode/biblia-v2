import { useLayoutEffect, useRef } from 'react'
import styles from './HomePage.module.css'

// Covering both sections makes this landscape wider than the viewport
// before it is cropped. Request enough pixels for that painted width.
const desktopSizes = '(min-width: 2000px) 100vw, 2000px'

export function HomeLandscape() {
  const imageRef = useRef(null)

  useLayoutEffect(() => {
    // React creates img before attaching picture. Safari can eagerly fetch
    // its fallback at that point, even when an AVIF source was preloaded.
    // Assign fallback attributes only once all sources are in the document.
    const image = imageRef.current
    image.sizes = desktopSizes
    image.srcset = '/assets/home-landscape-v4-960.webp 960w, /assets/home-landscape-v4-1280.webp 1280w, /assets/home-landscape-v4-1672.webp 1672w'
    image.src = '/assets/home-landscape-v4-960.webp'
  }, [])

  return (
    <picture aria-hidden="true" className={styles.heroLandscape}>
      <source media="(max-width: 620px)" sizes="600px" srcSet="/assets/home-landscape-v4-mobile-480.avif 480w, /assets/home-landscape-v4-mobile-850.avif 850w" type="image/avif" />
      <source media="(max-width: 620px)" sizes="600px" srcSet="/assets/home-landscape-v4-mobile-480.webp 480w, /assets/home-landscape-v4-mobile-850.webp 850w" type="image/webp" />
      <source sizes={desktopSizes} srcSet="/assets/home-landscape-v4-960.avif 960w, /assets/home-landscape-v4-1280.avif 1280w, /assets/home-landscape-v4-1672.avif 1672w" type="image/avif" />
      <img alt="" decoding="async" fetchPriority="high" height="941" ref={imageRef} width="1672" />
    </picture>
  )
}
