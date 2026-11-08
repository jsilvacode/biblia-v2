import { useEffect } from 'react'

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value))

/** Decorative depth only: the reading surfaces never participate in the motion. */
export function useHomeParallax(pageRef) {
  useEffect(() => {
    const page = pageRef.current
    if (!page) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const gentleMotion = window.matchMedia('(max-width: 620px), (pointer: coarse)')
    const layers = Array.from(page.querySelectorAll('[data-home-parallax]'), (element) => ({
      element,
      kind: element.dataset.homeParallax,
      region: element.closest('[data-home-parallax-region]') ?? element,
      visible: true,
      top: 0,
      height: 0,
      offset: null,
    }))
    let frame = 0
    let needsMeasurement = true
    let viewportHeight = window.innerHeight
    let pageTop = 0
    const motionPaused = () => document.hidden || document.documentElement.dataset.videoTheater === 'true'

    const resetLayer = (layer) => {
      layer.element.style.removeProperty('transform')
      layer.element.style.removeProperty('will-change')
      layer.offset = null
    }

    const measure = () => {
      const scrollTop = window.scrollY
      viewportHeight = window.innerHeight
      pageTop = page.getBoundingClientRect().top + scrollTop
      const bounds = new Map()
      for (const layer of layers) {
        if (!bounds.has(layer.region)) bounds.set(layer.region, layer.region.getBoundingClientRect())
        const rect = bounds.get(layer.region)
        layer.top = rect.top + scrollTop
        layer.height = rect.height
        layer.visible = rect.bottom > -120 && rect.top < viewportHeight + 120
      }
      needsMeasurement = false
    }

    const render = () => {
      frame = 0
      if (reducedMotion.matches || motionPaused()) return
      if (needsMeasurement) measure()
      const scrollTop = window.scrollY
      const gentle = gentleMotion.matches

      for (const layer of layers) {
        if (!intersections) layer.visible = layer.top + layer.height - scrollTop > -120 && layer.top - scrollTop < viewportHeight + 120
        if (!layer.visible) continue
        let offset
        if (layer.kind === 'landscape') {
          // The image drifts more slowly than the opening; its top remains
          // above the viewport, so the original crop needs no extra zoom.
          offset = clamp(scrollTop - layer.top, 0, layer.height) * (gentle ? 0.07 : 0.14)
        } else if (layer.kind === 'editorial') {
          const distance = viewportHeight / 2 - (layer.top - scrollTop + layer.height / 2)
          const limit = gentle ? 6 : 12
          offset = clamp(distance * (gentle ? 0.022 : 0.045), -limit, limit)
        } else {
          const far = layer.kind === 'ambient-far'
          const rate = far ? 0.025 : 0.045
          offset = clamp(scrollTop - pageTop, 0, gentle ? 1400 : 2600) * rate * (gentle ? 0.45 : 1)
        }

        const rounded = Math.round(offset * 100) / 100
        if (layer.element.style.willChange !== 'transform') layer.element.style.willChange = 'transform'
        if (rounded !== layer.offset) {
          layer.element.style.transform = `translate3d(0, ${rounded}px, 0)`
          layer.offset = rounded
        }
      }
    }

    const schedule = () => {
      if (!frame && !reducedMotion.matches && !motionPaused() && (needsMeasurement || !intersections || layers.some((layer) => layer.visible))) {
        frame = window.requestAnimationFrame(render)
      }
    }
    const invalidate = () => {
      needsMeasurement = true
      schedule()
    }
    const configureMotion = () => {
      page.dataset.homeMotion = reducedMotion.matches ? 'reduced' : 'active'
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      for (const layer of layers) resetLayer(layer)
      invalidate()
    }
    const onVisibilityChange = () => {
      if (motionPaused()) {
        if (frame) window.cancelAnimationFrame(frame)
        frame = 0
        for (const layer of layers) layer.element.style.removeProperty('will-change')
      } else invalidate()
    }

    const intersections = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) {
        for (const layer of layers) {
          if (layer.region !== entry.target) continue
          layer.visible = entry.isIntersecting
          if (!entry.isIntersecting) layer.element.style.removeProperty('will-change')
        }
      }
      schedule()
    }, { rootMargin: '120px 0px' })
    const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(invalidate)
    const theater = new MutationObserver(onVisibilityChange)
    theater.observe(document.documentElement, { attributes: true, attributeFilter: ['data-video-theater'] })
    sizes?.observe(page)
    for (const region of new Set(layers.map((layer) => layer.region))) {
      intersections?.observe(region)
      sizes?.observe(region)
    }

    configureMotion()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', invalidate, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    reducedMotion.addEventListener('change', configureMotion)
    gentleMotion.addEventListener('change', invalidate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      intersections?.disconnect()
      sizes?.disconnect()
      theater.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', invalidate)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      reducedMotion.removeEventListener('change', configureMotion)
      gentleMotion.removeEventListener('change', invalidate)
      for (const layer of layers) resetLayer(layer)
      delete page.dataset.homeMotion
    }
  }, [pageRef])
}
