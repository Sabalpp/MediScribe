const SIZE_CLASSES = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
  '2xl': 'h-20 w-20',
}

/**
 * MediScribe logo + optional wordmark. Use variant="onDark" on dark backgrounds (light chip behind mark).
 * Use bare for logo-only inside a custom container (e.g. login tile).
 */
export default function BrandMark({
  size = 'md',
  showWordmark = false,
  wordmarkClassName = '',
  className = '',
  imgClassName = '',
  variant = 'default',
  bare = false,
}) {
  const dim = SIZE_CLASSES[size] ?? SIZE_CLASSES.md
  const chip = variant === 'onDark' ? 'rounded-lg bg-white/95 p-1 shadow-sm ring-1 ring-white/20' : ''

  const img = (
    <img
      src="/mediscribe-logo.png"
      alt={showWordmark ? '' : 'MediScribe'}
      className={`${dim} object-contain ${imgClassName}`}
      decoding="async"
    />
  )

  if (bare) {
    return img
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`shrink-0 ${chip}`}>{img}</div>
      {showWordmark ? <span className={wordmarkClassName}>MediScribe</span> : null}
    </div>
  )
}
