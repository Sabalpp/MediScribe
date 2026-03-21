import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const WS_BASE = API.replace('http', 'ws')

const BUFFER_SECONDS = 12

const LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ne', label: 'Nepali' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
]

export default function RealTimeTalk() {
  const [lang, setLang] = useState('es')
  const [sessionId, setSessionId] = useState(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('')
  const [step, setStep] = useState('')
  const [doctorText, setDoctorText] = useState('')
  const [activeMic, setActiveMic] = useState(null) // 'patient' | 'doctor' | null
  const [bufferCount, setBufferCount] = useState(0)

  const wsRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const bufferTimerRef = useRef(null)
  const chunksRef = useRef([])
  const scrollRef = useRef(null)
  const activeMicRef = useRef(null)

  useEffect(() => { activeMicRef.current = activeMic }, [activeMic])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const addMsg = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, ts: new Date().toLocaleTimeString() }])
  }, [])

  // --- Session management ---
  const startSession = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: 'doctor_1', patient_language: lang }),
      })
      const data = await res.json()
      setSessionId(data.id)
      setStatus('Connecting...')

      const ws = new WebSocket(`${WS_BASE}/ws/session/${data.id}/`)

      ws.onopen = () => {
        setConnected(true)
        setStatus('Connected')
      }

      ws.onmessage = (e) => {
        const d = JSON.parse(e.data)

        if (d.type === 'connection_established') {
          setStatus('Ready')
          setStep('')
        } else if (d.type === 'processing') {
          setStatus(d.message || 'Processing...')
          setStep(d.step || '')
        } else if (d.type === 'patient_message') {
          setStatus('Ready')
          setStep('')
          addMsg({
            role: 'patient',
            original: d.original,
            rawEnglish: d.raw_english,
            fixedEnglish: d.fixed_english,
            flags: d.medical_flags,
          })
        } else if (d.type === 'provider_message') {
          setStatus('Ready')
          setStep('')
          addMsg({
            role: 'doctor',
            original: d.original,
            simplified: d.simplified,
            translated: d.translated,
            audio: d.audio_base64,
            suggestions: d.follow_up_suggestions,
          })
        } else if (d.type === 'error') {
          setStatus(`Error: ${d.message}`)
          setStep('')
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setStatus('Disconnected')
        stopAutoBuffer()
      }

      wsRef.current = ws
      addMsg({ role: 'system', original: `Session started — ${LANGUAGES.find((l) => l.code === lang)?.label}` })
    } catch (err) {
      setStatus(`Failed: ${err.message}`)
    }
  }, [lang, addMsg])

  const endSession = useCallback(async () => {
    stopAutoBuffer()
    if (wsRef.current) wsRef.current.close()
    if (sessionId) {
      try { await fetch(`${API}/api/sessions/${sessionId}/end/`, { method: 'POST' }) } catch {}
    }
    setConnected(false)
    setSessionId(null)
    setStatus('')
    addMsg({ role: 'system', original: 'Session ended' })
  }, [sessionId, addMsg])

  // --- Auto-buffer mic (10-15 second chunks) ---
  const sendCurrentChunk = useCallback((role) => {
    if (!recorderRef.current || recorderRef.current.state !== 'recording') return

    recorderRef.current.stop()

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    chunksRef.current = []

    if (blob.size > 1000 && wsRef.current?.readyState === WebSocket.OPEN) {
      const direction = role === 'patient' ? 'patient_to_provider' : 'provider_to_patient'
      wsRef.current.send(JSON.stringify({ type: 'audio_metadata', direction, patient_language: lang }))
      wsRef.current.send(blob)
      setBufferCount((c) => c + 1)
    }

    if (activeMicRef.current) {
      recorderRef.current.start()
    }
  }, [lang])

  const startAutoBuffer = useCallback(async (role) => {
    if (activeMic) {
      stopAutoBuffer()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {}

      recorder.start()
      recorderRef.current = recorder
      setActiveMic(role)
      setBufferCount(0)

      bufferTimerRef.current = setInterval(() => {
        sendCurrentChunk(role)
      }, BUFFER_SECONDS * 1000)
    } catch (err) {
      setStatus(`Mic error: ${err.message}`)
    }
  }, [activeMic, sendCurrentChunk])

  const stopAutoBuffer = useCallback(() => {
    if (bufferTimerRef.current) {
      clearInterval(bufferTimerRef.current)
      bufferTimerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      const role = activeMicRef.current
      recorderRef.current.stop()
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      chunksRef.current = []
      if (blob.size > 1000 && wsRef.current?.readyState === WebSocket.OPEN) {
        const direction = role === 'patient' ? 'patient_to_provider' : 'provider_to_patient'
        wsRef.current.send(JSON.stringify({ type: 'audio_metadata', direction, patient_language: lang }))
        wsRef.current.send(blob)
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    recorderRef.current = null
    setActiveMic(null)
  }, [lang])

  const sendDoctorText = useCallback(() => {
    const text = doctorText.trim()
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'provider_text', text, patient_language: lang }))
    setDoctorText('')
  }, [doctorText, lang])

  // --- Pipeline step indicator ---
  const stepIcons = { transcribing: '🎧', gemini: '🧠', tts: '🔊' }

  return (
    <div className="flex h-full flex-col bg-[#0f172a] text-[#e2e8f0]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">Real-Time Talk</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            connected ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
          }`}>
            {step ? `${stepIcons[step] || ''} ${status}` : status || 'Offline'}
          </span>
          {activeMic && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-900/50 px-3 py-1 text-xs font-bold text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              {activeMic === 'patient' ? 'Patient' : 'Doctor'} mic — sends every {BUFFER_SECONDS}s
              {bufferCount > 0 && <span className="ml-1 text-red-300">({bufferCount} sent)</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={connected}
            className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm disabled:opacity-50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          {!connected ? (
            <button onClick={startSession} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700">
              Start Session
            </button>
          ) : (
            <button onClick={endSession} className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700">
              End Session
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Messages column */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-600">
              <p className="text-lg">Start a session to begin</p>
              <p className="max-w-md text-center text-sm">
                Press a mic button to start continuous recording. Audio is automatically
                sent every {BUFFER_SECONDS} seconds — no manual stopping needed.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — follow-up suggestions */}
        {connected && <SuggestionsSidebar messages={messages} wsRef={wsRef} lang={lang} setDoctorText={setDoctorText} />}
      </div>

      {/* Controls */}
      {connected && (
        <div className="border-t border-[#1e293b] px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => activeMic === 'patient' ? stopAutoBuffer() : startAutoBuffer('patient')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                activeMic === 'patient'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              }`}
            >
              {activeMic === 'patient' ? '⏹ Stop Patient' : '🎤 Patient Mic'}
            </button>

            <button
              onClick={() => activeMic === 'doctor' ? stopAutoBuffer() : startAutoBuffer('doctor')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                activeMic === 'doctor'
                  ? 'bg-red-600 text-white'
                  : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
              }`}
            >
              {activeMic === 'doctor' ? '⏹ Stop Doctor' : '🩺 Doctor Mic'}
            </button>

            <div className="mx-2 h-6 w-px bg-[#334155]" />

            <input
              type="text"
              value={doctorText}
              onChange={(e) => setDoctorText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendDoctorText()}
              placeholder="Doctor: type a message..."
              className="flex-1 rounded-lg border border-[#334155] bg-[#1e293b] px-4 py-2.5 text-sm placeholder:text-gray-600"
            />
            <button
              onClick={sendDoctorText}
              disabled={!doctorText.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Message bubble — shows the two-mode pipeline output
// ---------------------------------------------------------------------------

function MessageBubble({ msg }) {
  if (msg.role === 'system') {
    return (
      <div className="text-center text-xs text-gray-500">
        {msg.original} <span className="text-gray-700">· {msg.ts}</span>
      </div>
    )
  }

  const isPatient = msg.role === 'patient'

  return (
    <div className={`flex ${isPatient ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[640px] rounded-2xl px-5 py-3 ${
        isPatient
          ? 'rounded-bl-sm border border-blue-900/50 bg-[#1a2744]'
          : 'rounded-br-sm border border-green-900/50 bg-[#1a2e1a]'
      }`}>
        <div className="mb-1 flex items-center gap-2">
          <span className={`text-xs font-bold ${isPatient ? 'text-blue-400' : 'text-green-400'}`}>
            {isPatient ? 'Patient' : 'Doctor'}
          </span>
          <span className="text-[10px] text-gray-600">{msg.ts}</span>
        </div>

        {isPatient ? (
          <>
            {/* Patient message — Mode 2 output */}
            <p className="text-sm text-gray-400">{msg.original}</p>
            {msg.rawEnglish && msg.rawEnglish !== msg.fixedEnglish && (
              <p className="mt-1 text-xs text-gray-600 line-through">{msg.rawEnglish}</p>
            )}
            <p className="mt-1 text-sm font-medium text-white">{msg.fixedEnglish}</p>

            {msg.flags && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.flags.urgency && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    msg.flags.urgency === 'high' ? 'bg-red-900/50 text-red-400'
                    : msg.flags.urgency === 'medium' ? 'bg-yellow-900/50 text-yellow-400'
                    : 'bg-gray-800 text-gray-400'
                  }`}>
                    {msg.flags.urgency} urgency
                  </span>
                )}
                {(msg.flags.symptoms || []).map((s, i) => (
                  <span key={i} className="rounded-full bg-[#334155] px-2 py-0.5 text-[10px]">{s}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Doctor message — Mode 1 output */}
            <p className="text-sm text-gray-400">{msg.original}</p>
            {msg.simplified && msg.simplified !== msg.original && (
              <p className="mt-1 rounded bg-green-900/20 px-2 py-1 text-xs text-green-300">
                Simplified: {msg.simplified}
              </p>
            )}
            <p className="mt-1 text-sm font-medium text-white">→ {msg.translated}</p>

            {msg.audio && (
              <audio className="mt-2 h-8 w-full" controls autoPlay src={`data:audio/mpeg;base64,${msg.audio}`} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sidebar — follow-up suggestions (hover / click)
// ---------------------------------------------------------------------------

function SuggestionsSidebar({ messages, wsRef, lang, setDoctorText }) {
  const allSuggestions = messages
    .filter((m) => m.role === 'doctor' && m.suggestions?.length)
    .flatMap((m) => m.suggestions)
  const allFlags = messages
    .filter((m) => m.role === 'patient' && m.flags?.suggested_questions?.length)
    .flatMap((m) => m.flags.suggested_questions)

  const patientSuggestions = [...new Set(allSuggestions)].slice(-6)
  const doctorFollowUps = [...new Set(allFlags)].slice(-6)

  if (patientSuggestions.length === 0 && doctorFollowUps.length === 0) {
    return (
      <aside className="w-72 shrink-0 border-l border-[#1e293b] p-4">
        <p className="text-xs text-gray-600">Suggestions will appear here as the conversation progresses.</p>
      </aside>
    )
  }

  return (
    <aside className="w-72 shrink-0 space-y-4 overflow-y-auto border-l border-[#1e293b] p-4">
      {patientSuggestions.length > 0 && (
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Patient could ask
          </h3>
          <div className="space-y-1.5">
            {patientSuggestions.map((s, i) => (
              <p key={i} className="rounded-lg bg-blue-900/20 px-3 py-2 text-xs text-blue-200">{s}</p>
            ))}
          </div>
        </div>
      )}
      {doctorFollowUps.length > 0 && (
        <div>
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-green-400">
            Doctor follow-ups
          </h3>
          <div className="space-y-1.5">
            {doctorFollowUps.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'provider_text', text: q, patient_language: lang }))
                  }
                }}
                className="block w-full rounded-lg bg-green-900/20 px-3 py-2 text-left text-xs text-green-200 transition hover:bg-green-900/40"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
