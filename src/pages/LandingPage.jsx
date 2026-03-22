import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PatientExperienceScrolly from '../components/PatientExperienceScrolly'
import SimpleModal from '../components/SimpleModal'
import BrandMark from '../components/BrandMark'
import { useToast } from '../context/ToastContext'

export default function LandingPage() {
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const { showToast } = useToast()

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      <Navbar />

      <header className="dark-section px-8 pb-20 pt-32 md:pb-32 md:pt-48">
        <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/90">
            <BrandMark size="sm" variant="onDark" className="gap-0" />
            Live Medical Translation
          </div>

          <h1 className="mb-8 text-5xl font-black leading-[1.1] tracking-tighter text-white md:text-7xl">
            Understand your doctor, <br />
            in your language.
          </h1>

          <p className="mb-12 max-w-2xl text-lg font-medium text-white/70 md:text-xl">
            Real time video and call translation so you never miss a word during your next visit. Every word your doctor says,
            explained clearly in the language that's clear to you.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="clinical-gradient rounded-lg px-10 py-4 text-lg font-bold text-white shadow-sm transition-all duration-200 hover:scale-[0.98]"
            >
              Launch MediScribe
            </Link>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="rounded-lg border border-white/20 bg-white/10 px-10 py-4 text-lg font-bold text-white transition-all duration-200 hover:bg-white/15"
            >
              Your privacy matters
            </button>
          </div>
        </div>
      </header>

      <div id="patient-experience">
        <PatientExperienceScrolly />
      </div>

      <section id="clinical-insight" className="bg-surface px-8 py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-12">
          <div className="flex justify-center md:col-span-7">
            <div className="relative w-full overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-2xl">
              <div className="flex h-8 w-full items-center gap-2 bg-surface-container-high px-4">
                <div className="h-2 w-2 rounded-full bg-error/40"></div>
                <div className="h-2 w-2 rounded-full bg-tertiary/40"></div>
                <div className="h-2 w-2 rounded-full bg-secondary/40"></div>
              </div>

              <div className="grid grid-cols-3 gap-6 p-8">
                <div className="col-span-2">
                  <div className="mb-6 h-4 w-48 rounded bg-surface-container-high"></div>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-surface-container-low p-4">
                      <div className="mb-1 text-[10px] font-bold uppercase text-primary">What your doctor said</div>
                      <p className="text-sm font-medium text-on-surface">
                        &ldquo;I&apos;d like to check for pleuritic symptoms. We&apos;ll run a troponin test and an EKG.&rdquo;
                      </p>
                    </div>
                    <div className="border-l-4 border-secondary bg-secondary-container/10 p-4">
                      <div className="mb-1 text-[10px] font-bold uppercase text-secondary">What it means for you</div>
                      <p className="text-sm font-medium">
                        Your doctor wants to check if your chest pain is related to your heart or lungs. These are quick, painless tests.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="flex h-32 items-center justify-center rounded-lg bg-primary/5">
                    <div className="opacity-[0.22]">
                      <BrandMark size="xl" className="gap-0" />
                    </div>
                  </div>
                  <div className="h-4 w-full rounded bg-surface-container-high"></div>
                  <div className="h-4 w-2/3 rounded bg-surface-container-high"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="mb-8 h-1 w-12 bg-primary"></div>
            <h2 className="mb-6 text-4xl font-black tracking-tight text-primary">Expect more.</h2>
            <p className="mb-8 text-lg leading-relaxed text-on-surface-variant">
              MediScribe does more than just translate; it breaks down complex medical language, giving you the control to make informed choices about your health.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-surface-container-low p-4">
                <div className="text-2xl font-black text-primary">99%</div>
                <div className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                  Translation Accuracy
                </div>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <div className="text-2xl font-black text-primary">&lt;150ms</div>
                <div className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">Latency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="bg-surface-container-low px-8 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h3 className="mb-12 text-xs font-black uppercase tracking-[0.2em] text-outline">Powered by technology you can trust</h3>
          <div className="flex flex-wrap justify-center gap-12 opacity-60 transition-all duration-500 grayscale hover:grayscale-0 md:gap-24">
            {[
              { name: 'ElevenLabs', role: 'Records Voice' },
              { name: 'Google Gemini', role: 'Trascribes Speech' },
              { name: 'Snowflake', role: 'Checks Transcription' },
            ].map((tech) => (
              <div key={tech.name} className="flex flex-col items-center gap-2">
                <div className="text-2xl font-black tracking-tighter text-on-surface">{tech.name}</div>
                <div className="text-[10px] font-bold uppercase text-outline">{tech.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      <SimpleModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="How we protect your privacy">
        <ul className="list-inside list-disc space-y-2">
          <li>Your conversations are encrypted end-to-end during your visit.</li>
          <li>We never share your health information with anyone without your permission.</li>
          <li>Audio is processed in real time and is not stored after your visit ends.</li>
          <li>You can request deletion of all your data at any time.</li>
        </ul>
        <p className="mt-4 text-xs text-outline">
          Full privacy policy available upon request. Contact your care team for details.
        </p>
        <button
          type="button"
          onClick={() => {
            showToast('Privacy info sent to your email (demo).')
            setPrivacyOpen(false)
          }}
          className="clinical-gradient mt-6 w-full rounded-lg py-3 text-sm font-bold text-white"
        >
          Send me the full policy
        </button>
      </SimpleModal>
    </div>
  )
}
