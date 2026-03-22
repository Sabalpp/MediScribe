const SPANISH_FULL = 'Me duele mucho el pecho al respirar profundo...'
const ENGLISH_FULL = 'My chest hurts a lot when I breathe deeply...'

export default function PatientExperienceScrolly() {
  return (
    <section className="bg-surface-container px-8 py-24" aria-label="How it works">
      <div className="mx-auto max-w-7xl">
        <div className="flex w-full flex-col gap-10 py-6 lg:px-4">
          <div className="w-full shrink-0 lg:max-w-[52.5rem]">
            <div className="mb-8 h-1 w-12 bg-secondary"></div>
            <h2 className="mb-6 text-4xl font-black tracking-tight text-primary">
              Understand your doctor in real time.
            </h2>
            <p className="mb-8 text-[1.40625rem] leading-relaxed text-on-surface-variant">
              All you have to do is say what&apos;s on your mind and MediScribe listens and translates so your doctor knows exaclty what you need. Then, when it&apos;s their turn,
              MediScribe not only translates for you in but also simplies any of your doctor&apos;s jargon so don&apos;t miss a word.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 font-semibold text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Includes 32 languages and mixed languages
              </li>
              <li className="flex items-center gap-3 font-semibold text-secondary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Live translations in 10,000+ voices
              </li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-3xl shrink-0 pb-4">
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

                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="h-2 w-2 shrink-0 rounded-full bg-secondary"></div>
                      <span className="text-xs font-bold uppercase tracking-widest text-white">Live Translation</span>
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-white/60">ES</span>
                    </div>
                    <p className="min-h-[3.25rem] text-sm font-medium italic leading-relaxed text-white">
                      &ldquo;{SPANISH_FULL}&rdquo;
                    </p>
                    <div className="mt-2 text-[10px] font-bold uppercase text-secondary">
                      <span className="flex flex-wrap items-center gap-2 text-white/90">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                        English: {ENGLISH_FULL}
                      </span>
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
