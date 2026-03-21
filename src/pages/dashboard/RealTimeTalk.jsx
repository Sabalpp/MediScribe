import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const WS_BASE = API.replace('http', 'ws')

const LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
]

export default function RealTimeTalk() {
  const [lang, setLang] = useState('es')
  const [sessionId, setSessionId] = useState(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('')
  const [doctorText, setDoctorText] = useState('')
  const [recording, setRecording] = useState(null) // 'patient' | 'doctor' | null

  const wsRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const addMsg = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, ts: new Date().toLocaleTimeString() }])
  }, [])

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
        } else if (d.type === 'transcribing') {
          setStatus('Transcribing...')
        } else if (d.type === 'translating') {
          setStatus('Translating...')
        } else if (d.type === 'patient_message') {
          setStatus('Ready')
          addMsg({
            role: 'patient',
            original: d.original,
            translated: d.translated,
            flags: d.medical_flags,
          })
        } else if (d.type === 'provider_message') {
          setStatus('Ready')
          addMsg({
            role: 'doctor',
            original: d.original,
            translated: d.translated,
            audio: d.audio_base64,
          })
        } else if (d.type === 'error') {
          setStatus(`Error: ${d.message}`)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        setStatus('Disconnected')
      }

      wsRef.current = ws
      addMsg({ role: 'system', original: `Session started (${LANGUAGES.find((l) => l.code === lang)?.label})` })
    } catch (err) {
      setStatus(`Failed: ${err.message}`)
    }
  }, [lang, addMsg])

  const endSession = useCallback(async () => {
    if (wsRef.current) wsRef.current.close()
    if (sessionId) {
      try {
        await fetch(`${API}/api/sessions/${sessionId}/end/`, { method: 'POST' })
      } catch {}
    }
    setConnected(false)
    setSessionId(null)
    setStatus('')
    addMsg({ role: 'system', original: 'Session ended' })
  }, [sessionId, addMsg])

  const toggleMic = useCallback(
    async (role) => {
      if (recording) {
        recorderRef.current?.stop()
        setRecording(null)
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
        chunksRef.current = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          stream.getTracks().forEach((t) => t.stop())

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const direction = role === 'patient' ? 'patient_to_provider' : 'provider_to_patient'
            wsRef.current.send(
              JSON.stringify({
                type: 'audio_metadata',
                direction,
                patient_language: lang,
              })
            )
            wsRef.current.send(blob)
            setStatus(`Sent ${(blob.size / 1024).toFixed(0)}KB audio...`)
          }
        }

        recorder.start()
        recorderRef.current = recorder
        setRecording(role)
      } catch (err) {
        setStatus(`Mic error: ${err.message}`)
      }
    },
    [recording, lang]
  )

  const sendDoctorText = useCallback(() => {
    const text = doctorText.trim()
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ type: 'provider_text', text, patient_language: lang }))
    setDoctorText('')
    setStatus('Translating...')
  }, [doctorText, lang])

  return (
    <div className="flex h-full flex-col bg-[#0f172a] text-[#e2e8f0]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">Real-Time Talk</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              connected ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
            }`}
          >
            {status || 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={connected}
            className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm disabled:opacity-50"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          {!connected ? (
            <button
              onClick={startSession}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Start Session
            </button>
          ) : (
            <button
              onClick={endSession}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-6">
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-600">
            <p>Start a session and speak into your mic</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {connected && (
        <div className="border-t border-[#1e293b] px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleMic('patient')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                recording === 'patient'
                  ? 'animate-pulse bg-green-600 text-white'
                  : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
              }`}
            >
              {recording === 'patient' ? '⏹ Stop Patient Mic' : '🎤 Patient Mic'}
            </button>

            <button
              onClick={() => toggleMic('doctor')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                recording === 'doctor'
                  ? 'animate-pulse bg-green-600 text-white'
                  : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
              }`}
            >
              {recording === 'doctor' ? '⏹ Stop Doctor Mic' : '🩺 Doctor Mic'}
            </button>

            <div className="mx-2 h-6 w-px bg-[#334155]" />

            <input
              type="text"
              value={doctorText}
              onChange={(e) => setDoctorText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendDoctorText()}
              placeholder="Or type doctor's response..."
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
      <div
        className={`max-w-[600px] rounded-2xl px-5 py-3 ${
          isPatient
            ? 'rounded-bl-sm bg-[#1a2744] border border-blue-900/50'
            : 'rounded-br-sm bg-[#1a2e1a] border border-green-900/50'
        }`}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className={`text-xs font-bold ${isPatient ? 'text-blue-400' : 'text-green-400'}`}>
            {isPatient ? 'Patient' : 'Doctor'}
          </span>
          <span className="text-[10px] text-gray-600">{msg.ts}</span>
        </div>
        <p className="text-sm font-medium">{msg.original}</p>
        <p className="mt-1 text-sm text-gray-400">→ {msg.translated}</p>

        {msg.flags && Object.keys(msg.flags).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.flags.urgency && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  msg.flags.urgency === 'high'
                    ? 'bg-red-900/50 text-red-400'
                    : msg.flags.urgency === 'medium'
                    ? 'bg-yellow-900/50 text-yellow-400'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {msg.flags.urgency} urgency
              </span>
            )}
            {(msg.flags.symptoms || []).map((s, i) => (
              <span key={i} className="rounded-full bg-[#334155] px-2 py-0.5 text-[10px]">
                {s}
              </span>
            ))}
            {(msg.flags.suggested_questions || []).map((q, i) => (
              <span key={i} className="rounded-full bg-blue-900/30 px-2 py-0.5 text-[10px] italic text-blue-300">
                {q}
              </span>
            ))}
          </div>
        )}

        {msg.audio && (
          <audio
            className="mt-2 h-8 w-full"
            controls
            autoPlay
            src={`data:audio/mpeg;base64,${msg.audio}`}
          />
        )}
      </div>
    </div>
  )
}
