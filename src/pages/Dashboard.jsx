import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'

const mockConversation = [
  {
    id: 1,
    source: 'Doctor, me duele mucho el pecho cuando respiro profundo.',
    translated: 'My chest hurts a lot when I breathe deeply..',
    sourceTime: '14:02:12',
    translatedTime: '14:02:13',
  },
  {
    id: 2,
    source: 'También siento como si mi corazón estuviera saltando latidos. Tengo miedo de que sea algo grave.',
    translated: "I also feel as if my heart were skipping beats. I'm afraid it might be something serious.",
    sourceTime: '14:02:45',
    translatedTime: '14:02:46',
  },
  {
    id: 3,
    source: 'A veces me mareo cuando me levanto rápido y veo pequeñas luces.',
    translated: 'Sometimes I feel dizzy when I stand up quickly and I see small lights.',
    sourceTime: '14:03:18',
    translatedTime: '14:03:19',
  },
  {
    id: 4,
    source: 'Mi madre tuvo problemas del corazón. Ella falleció de un infarto a los cincuenta y dos años.',
    translated: 'My mother had heart problems. She passed away from a heart attack at fifty-two years old.',
    sourceTime: '14:03:55',
    translatedTime: '14:03:56',
  },
]

const medicalTerms = ['Pleurisy', 'Palpitaciones', 'Dyspnea', 'Myocarditis Risk', 'Syncope', 'Photopsia']

const FIRST_REVEAL_MS = 2500
const FOLLOW_UP_MS = 2500

const ENGLISH_READY_LABEL =
  'ENGLISH: MY CHEST HURTS A LOT WHEN I BREATHE DEEPLY...'

export default function Dashboard() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(true)
  const scrollRef = useRef(null)
  const englishBarRef = useRef(null)

  useEffect(() => {
    let intervalId
    let timeoutId
    let raf1 = 0
    let raf2 = 0

    const startStream = () => {
      setMessages([mockConversation[0]])
      let idx = 1
      intervalId = setInterval(() => {
        if (idx < mockConversation.length) {
          setMessages((prev) => [...prev, mockConversation[idx]])
          idx++
        } else {
          clearInterval(intervalId)
          setIsStreaming(false)
        }
      }, FOLLOW_UP_MS)
    }

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!englishBarRef.current) return
        timeoutId = setTimeout(startStream, FIRST_REVEAL_MS)
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      if (timeoutId) clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/10 bg-surface-container-low px-8">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold tracking-tight text-primary">Live Consultation: Elena Vasquez</h1>
            <div className="flex items-center rounded-full bg-surface-container-highest px-1 py-1">
              <div className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-1.5 text-xs font-bold text-primary shadow-sm">
                <span className="pulse-active h-2 w-2 rounded-full bg-tertiary-fixed-dim"></span>
                TWELVELABS ACTIVE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-1.5">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-outline">Input</span>
              <span className="text-sm font-semibold text-on-surface">Spanish (MX)</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>
            <span className="material-symbols-outlined text-outline">arrow_forward</span>
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-1.5">
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-outline">Output</span>
              <span className="text-sm font-semibold text-on-surface">English (US)</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>
            <div className="mx-2 h-6 w-px bg-outline-variant"></div>
            <button className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-bold text-white transition-opacity active:opacity-80">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                stop_circle
              </span>
              End Session
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <section className="flex flex-1 flex-col bg-surface">
            <div ref={scrollRef} className="no-scrollbar flex-1 space-y-8 overflow-y-auto p-8">
              <div
                ref={englishBarRef}
                className="flex w-full items-center gap-3 rounded-md bg-primary px-4 py-3.5 shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/95" aria-hidden>
                  <span
                    className="material-symbols-outlined text-[20px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
                <p className="text-sm font-bold uppercase tracking-wide text-white">{ENGLISH_READY_LABEL}</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-secondary">
                      Patient Audio (Source)
                    </span>
                  </div>
                  <div className="flex flex-col gap-6">
                    {messages.map((msg) => (
                      <div key={`src-${msg.id}`} className="rounded-lg border-l-4 border-secondary bg-surface-container-low p-4">
                        <p className="leading-relaxed text-on-surface">{msg.source}</p>
                        <span className="mt-2 block text-[10px] text-outline">{msg.sourceTime}</span>
                      </div>
                    ))}
                    {isStreaming && (
                      <div className="rounded-lg border-l-4 border-secondary bg-surface-container-low p-4 opacity-60">
                        <p className="italic text-on-surface">...procesando voz en tiempo real...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary">
                      Provider Feed (Translated)
                    </span>
                  </div>
                  <div className="flex flex-col gap-6">
                    {messages.map((msg) => (
                      <div
                        key={`trans-${msg.id}`}
                        className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm"
                      >
                        <p className="leading-relaxed text-on-surface">{msg.translated}</p>
                        <span className="mt-2 block text-[10px] text-outline">{msg.translatedTime}</span>
                      </div>
                    ))}
                    {isStreaming && (
                      <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant/30 bg-surface-container-low/50 p-4">
                        <div className="flex gap-1">
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-container"></div>
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-container [animation-delay:-0.3s]"></div>
                          <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-container [animation-delay:-0.5s]"></div>
                        </div>
                        <span className="text-xs font-medium text-outline">Synthesizing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-12 shrink-0 items-center justify-between bg-surface-container px-8">
              <div className="flex gap-4">
                <button className="text-[0.6875rem] font-bold text-outline transition-colors hover:text-primary">
                  FLAG INCORRECT TRANSLATION
                </button>
                <button className="text-[0.6875rem] font-bold text-outline transition-colors hover:text-primary">
                  ADD MANUAL NOTE
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-secondary"></span>
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-secondary">
                  Connection Stable - 42ms Latency
                </span>
              </div>
            </div>
          </section>

          <ClinicalInsights messages={messages} medicalTerms={medicalTerms} />
        </div>
      </main>
    </div>
  )
}

function ClinicalInsights({ messages, medicalTerms }) {
  const visibleTerms = medicalTerms.slice(0, Math.min(messages.length * 2, medicalTerms.length))

  return (
    <aside className="no-scrollbar w-[400px] space-y-6 overflow-y-auto bg-surface-container-low p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-on-surface">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            insights
          </span>
          Clinical Insights
        </h2>
        <span className="rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-bold text-on-primary-container">
          GEMINI 1.5 PRO
        </span>
      </div>

      <div className="rounded-lg border-l-4 border-error bg-surface-container-lowest p-4 shadow-sm">
        <div className="mb-2 flex items-start justify-between">
          <span className="text-xs font-bold uppercase text-error">Active Symptoms Detected</span>
          <span className="text-[10px] text-outline">Detected 12s ago</span>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-error">warning</span>
            Chest Pain (Pleuritic nature)
          </li>
          <li className="flex items-center gap-2 text-sm text-on-surface">
            <span className="material-symbols-outlined text-[16px] text-error">warning</span>
            Palpitations / Arrhythmia
          </li>
          {messages.length >= 3 && (
            <li className="flex items-center gap-2 text-sm text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-error">warning</span>
              Orthostatic Syncope
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[0.6875rem] font-bold uppercase tracking-tighter text-outline">Snowflake / RAG Context</span>
          <div className="h-px flex-1 bg-outline-variant/30"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleTerms.map((term) => (
            <span
              key={term}
              className="rounded-full border border-outline-variant/30 bg-surface-container-highest px-2.5 py-1 text-[11px] font-medium text-on-surface"
            >
              {term}
            </span>
          ))}
        </div>

        <div className="space-y-3 rounded-lg bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
            <span className="material-symbols-outlined text-[18px] text-primary">verified</span>
            <span className="text-xs font-bold text-on-surface">Protocol Suggestion</span>
          </div>
          <p className="text-xs leading-relaxed text-on-surface-variant">
            Based on described symptoms (deep inspiration pain + palpitations), assess for{' '}
            <span className="font-bold text-primary">Pericarditis</span> or <span className="font-bold text-primary">PE</span>.
          </p>
          <div className="rounded bg-surface-container-low p-2 font-mono text-[10px] text-on-surface-variant">
            REF: Mayo Clinic CV Protocol #442-B
          </div>
          <button className="w-full rounded bg-surface-container-high py-2 text-[10px] font-bold uppercase text-on-surface transition-colors hover:bg-surface-container-highest">
            ORDER STAT EKG
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-[0.6875rem] font-bold uppercase tracking-tighter text-outline">History Relevance</span>
        <div className="space-y-2 rounded-lg bg-surface-container-high p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface">Hypertension</span>
            <span className="text-[10px] font-bold text-secondary">MANAGED</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface">Family Cardiac History</span>
            <span className="text-[10px] font-bold text-tertiary">RELEVANT</span>
          </div>
          {messages.length >= 4 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface">Maternal MI (age 52)</span>
              <span className="text-[10px] font-bold text-error">CRITICAL</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/20 pt-4">
        <span className="mb-3 block text-[0.6875rem] font-bold uppercase tracking-tighter text-outline">
          Live Vitals Integration
        </span>
        <div className="relative h-24 overflow-hidden rounded-lg bg-surface-container-highest">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-outline-variant">LIVE ECG STREAM</span>
          </div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #00478d 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          ></div>
          <svg className="absolute bottom-0 h-12 w-full fill-none text-secondary" viewBox="0 0 400 60">
            <path
              d="M0,30 L50,30 L60,10 L70,50 L80,30 L150,30 L160,10 L170,50 L180,30 L250,30 L260,10 L270,50 L280,30 L350,30 L360,10 L370,50 L400,30"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
        <div className="mt-2 flex justify-between">
          <div className="text-center">
            <span className="block text-[10px] font-bold uppercase text-outline">BPM</span>
            <span className="text-lg font-black text-on-surface">88</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-bold uppercase text-outline">SpO2</span>
            <span className="text-lg font-black text-secondary">98%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-bold uppercase text-outline">TEMP</span>
            <span className="text-lg font-black text-on-surface">98.4</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
