import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PatientExperienceScrolly from '../components/PatientExperienceScrolly'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      <Navbar />

      <header className="bg-surface px-8 pb-20 pt-32 md:pb-32 md:pt-48">
        <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-secondary-container">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              emergency_home
            </span>
            Clinical Precision AI
          </div>

          <h1 className="mb-8 text-5xl font-black leading-[1.1] tracking-tighter text-primary md:text-7xl">
            Breaking the Medical <br />
            Language Barrier.
          </h1>

          <p className="mb-12 max-w-2xl text-lg font-medium text-on-surface-variant md:text-xl">
            Real-time clinical translation that preserves medical nuances, ensuring every patient is heard and every
            provider is understood.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="clinical-gradient rounded-lg px-10 py-4 text-lg font-bold text-white shadow-sm transition-all duration-200 hover:scale-[0.98]"
            >
              Request a Demo
            </Link>
            <button
              type="button"
              className="rounded-lg bg-surface-container-highest px-10 py-4 text-lg font-bold text-on-surface transition-all duration-200 hover:bg-surface-container-high"
            >
              View Enterprise Security
            </button>
          </div>
        </div>
      </header>

      <PatientExperienceScrolly />

      <section className="bg-surface px-8 py-24">
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
                      <div className="mb-1 text-[10px] font-bold uppercase text-primary">Clinical Context Extraction</div>
                      <p className="text-sm font-medium text-on-surface">
                        &ldquo;Patient reports acute thoracic pain during deep inspiration. Possible pleuritic
                        symptoms.&rdquo;
                      </p>
                    </div>
                    <div className="border-l-4 border-secondary bg-secondary-container/10 p-4">
                      <div className="mb-1 text-[10px] font-bold uppercase text-secondary">Vital Flags</div>
                      <p className="text-sm font-medium">BP: 135/85 | HR: 92 bpm</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="flex h-32 items-center justify-center rounded-lg bg-primary/5">
                    <span className="material-symbols-outlined text-4xl text-primary/20">analytics</span>
                  </div>
                  <div className="h-4 w-full rounded bg-surface-container-high"></div>
                  <div className="h-4 w-2/3 rounded bg-surface-container-high"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="mb-8 h-1 w-12 bg-primary"></div>
            <h2 className="mb-6 text-4xl font-black tracking-tight text-primary">Clinical Insight.</h2>
            <p className="mb-8 text-lg leading-relaxed text-on-surface-variant">
              MediScribe doesn&apos;t just translate words; it extracts clinical context. Providers receive high-fidelity,
              medically-coded summaries that integrate directly into EHR systems, reducing cognitive load and
              administrative burden.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-surface-container-low p-4">
                <div className="text-2xl font-black text-primary">99.4%</div>
                <div className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">
                  Medical Accuracy
                </div>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <div className="text-2xl font-black text-primary">&lt;200ms</div>
                <div className="text-xs font-bold uppercase tracking-tighter text-on-surface-variant">Latency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low px-8 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h3 className="mb-12 text-xs font-black uppercase tracking-[0.2em] text-outline">The Infrastructure of Trust</h3>
          <div className="flex flex-wrap justify-center gap-12 opacity-60 transition-all duration-500 grayscale hover:grayscale-0 md:gap-24">
            {[
              { name: 'Google Gemini', role: 'LLM Backbone' },
              { name: 'ElevenLabs', role: 'Neural Synthesis' },
              { name: 'Snowflake', role: 'RAG Architecture' },
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
    </div>
  )
}
