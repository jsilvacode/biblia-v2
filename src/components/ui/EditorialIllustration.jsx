import { useSettings } from '../../features/settings/SettingsProvider'

const nightSources = Object.freeze({
  '/assets/editorial/beliefs/scriptures.webp': '/assets/editorial/beliefs/scriptures-night-v1.webp',
  '/assets/editorial/beliefs/creation.webp': '/assets/editorial/beliefs/creation-night-v1.webp',
  '/assets/editorial/beliefs/salvation.webp': '/assets/editorial/beliefs/salvation-night-v1.webp',
  '/assets/editorial/beliefs/church-v1.webp': '/assets/editorial/beliefs/church-night-v1.webp',
  '/assets/editorial/beliefs/christian-life-v1.webp': '/assets/editorial/beliefs/christian-life-night-v1.webp',
  '/assets/editorial/beliefs/restoration-v1.webp': '/assets/editorial/beliefs/restoration-night-v1.webp',
  '/assets/editorial/bible-library-v1.webp': '/assets/editorial/bible-library-night-v1.webp',
  '/assets/editorial/daily-reading-v1.webp': '/assets/editorial/daily-reading-night-v1.webp',
  '/assets/editorial/faith-v1.webp': '/assets/editorial/faith-night-v1.webp',
  '/assets/editorial/guidance-v1.webp': '/assets/editorial/guidance-night-v1.webp',
  '/assets/editorial/saved-v1.webp': '/assets/editorial/saved-night-v1.webp',
  '/assets/editorial/search-v1.webp': '/assets/editorial/search-night-v1.webp',
})

export function EditorialIllustration({ alt = '', className = '', src, ...imageProps }) {
  const { resolvedTheme } = useSettings()
  const source = resolvedTheme === 'dark' ? nightSources[src] ?? src : src

  return <img {...imageProps} alt={alt} className={`editorial-illustration${className ? ` ${className}` : ''}`} src={source} />
}
