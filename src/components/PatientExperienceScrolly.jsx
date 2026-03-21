import { useEffect, useRef, useState } from 'react'

const SPANISH_FULL = 'Me duele mucho el pecho al respirar profundo...'
const ENGLISH_FULL = 'My chest hurts a lot when I breathe deeply...'

function getInitialReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getSectionScrollProgress(el) {
  if (!el) return 0
  const scrollable = Math.max(el.offsetHeight - window.innerHeight, 1)
  const rect = el.getBoundingClientRect()
  const scrolled = Math.min(Math.max(-rect.top, 0), scrollable)
  return scrolled / scrollable
}

export default function PatientExperienceScrolly() {
  const sectionRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion)
  const [progress, setProgress] = useState(() => (getInitialReducedMotion() ? 1 : 0))

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')

    let raf = 0
    const update = () => {
      if (mq.matches) {
        setProgress(1)
        return
      }
      setProgress(getSectionScrollProgress(sectionRef.current))
    }

    const onScroll = () => {
      if (mq.matches) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    const onMq = () => {
      setReducedMotion(mq.matches)
      if (mq.matches) setProgress(1)
      else update()
    }

    update()
    mq.addEventListener('change', onMq)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      mq.removeEventListener('change', onMq)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const effectiveProgress = reducedMotion ? 1 : progress
  const charCount = Math.min(
    SPANISH_FULL.length,
    Math.floor(effectiveProgress * SPANISH_FULL.length + 1e-6),
  )
  const visibleSpanish = SPANISH_FULL.slice(0, charCount)
  const isComplete = charCount >= SPANISH_FULL.length

  return (
    <section ref={sectionRef} className="bg-surface-container-low px-8 py-24" aria-label="Patient experience">
      <div className="mx-auto min-h-[260vh] max-w-7xl">
        <div className="sticky top-20 flex min-h-[100dvh] w-full flex-col items-center justify-center gap-10 py-6 lg:flex-row lg:items-center lg:gap-12 lg:px-4">
          <div className="w-full shrink-0 lg:max-w-md">
            <div className="mb-8 h-1 w-12 bg-secondary"></div>
            <h2 className="mb-6 text-4xl font-black tracking-tight text-primary">Natively Human.</h2>
            <p className="mb-8 text-lg leading-relaxed text-on-surface-variant">
              Patients can speak in their native tongue without the anxiety of translation errors. MediScribe captures
              every symptom, emotion, and nuance, delivering a sense of being truly understood in moments that matter
              most.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 font-semibold text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                100+ Dialects Supported
              </li>
              <li className="flex items-center gap-3 font-semibold text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Zero-Latency Audio Stream
              </li>
            </ul>
          </div>

          <div className="relative w-full max-w-3xl shrink-0 lg:flex-1">
            <div className="relative w-full overflow-hidden rounded-xl border border-outline-variant/10 bg-slate-900 shadow-2xl">
              <div className="flex h-8 w-full shrink-0 items-center gap-2 bg-surface-container-high px-4">
                <div className="h-2 w-2 rounded-full bg-error/40"></div>
                <div className="h-2 w-2 rounded-full bg-tertiary/40"></div>
                <div className="h-2 w-2 rounded-full bg-secondary/40"></div>
              </div>

              <div className="relative aspect-[16/10] w-full bg-gradient-to-b from-primary/25 to-primary/55">
                <div className="flex h-full w-full items-center justify-center pt-16">
                  <span className="material-symbols-outlined text-[72px] text-white/25 md:text-[96px]">laptop_mac</span>
                </div>

                <div className="absolute inset-x-0 top-0 p-4 md:p-5">
                  <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg transition-[opacity] duration-150">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-secondary"></div>
                      <span className="text-xs font-bold uppercase tracking-widest text-white">Live Translation</span>
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-white/60">ES</span>
                    </div>
                    <p className="min-h-[3.25rem] text-sm font-medium italic leading-relaxed text-white transition-opacity duration-75">
                      &ldquo;{visibleSpanish}
                      {!isComplete && (
                        <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-white/80 align-middle" />
                      )}
                      {isComplete ? '\u201d' : ''}
                    </p>
                    <div
                      className={`mt-2 text-[10px] font-bold uppercase transition-colors duration-200 ${
                        isComplete ? 'text-secondary' : 'text-primary-fixed-dim'
                      }`}
                    >
                      {isComplete ? (
                        <span className="flex flex-wrap items-center gap-2 text-white/90">
                          <span
                            className="material-symbols-outlined text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                          English: {ENGLISH_FULL}
                        </span>
                      ) : (
                        'Translating to English...'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="h-2 w-[55%] rounded-b-md bg-slate-700/90"
                style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: '-1px' }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
