import { useState, useEffect, useRef, useCallback } from 'react'
import { ragQuery } from '../services/api'

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ko', label: '한국어' },
  { code: 'vi', label: 'Tiếng Việt' },
]

export default function OverlayApp() {
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [language, setLanguage] = useState('es')
  const [muted, setMuted] = useState(false)
  const [activeTab, setActiveTab] = useState('transcript')
  const [sessionActive, setSessionActive] = useState(false)
  const feedRef = useRef(null)

  useEffect(() => {
    const cleanupStart = window.electronAPI?.onSessionStarted?.(() => {
      setSessionActive(true)
      setMessages([])
      setChatHistory([])
    })
    const cleanupEnd = window.electronAPI?.onSessionEnded?.(() => {
      setSessionActive(false)
    })
    return () => {
      cleanupStart?.()
      cleanupEnd?.()
    }
  }, [])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages, chatHistory])

  const handleAskQuestion = useCallback(async () => {
    const q = chatInput.trim()
    if (!q) return
    setChatHistory((prev) => [...prev, { role: 'user', text: q }])
    setChatInput('')
    try {
      const res = await ragQuery({ question: q, sessionContext: messages })
      setChatHistory((prev) => [...prev, { role: 'assistant', text: res.answer }])
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I could not get an answer right now.' },
      ])
    }
  }, [chatInput, messages])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  return (
    <div className="w-full h-screen flex flex-col select-none" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex flex-col h-full rounded-2xl overflow-hidden bg-surface-900/95 text-white backdrop-blur-xl border border-white/10 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-surface-950/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase opacity-80">
              MediScribe
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' }}>
            <button
              onClick={() => window.electronAPI?.toggleOverlay(false)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors text-sm"
              title="Minimize"
            >
              −
            </button>
          </div>
        </div>

        {/* Language + Mute */}
        <div
          className="flex items-center gap-2 px-4 py-2 border-b border-white/5"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-surface-800 text-white text-xs rounded px-2 py-1 border border-white/10 outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setMuted(!muted)}
            className={`ml-auto text-xs px-2 py-1 rounded ${
              muted
                ? 'bg-red-500/20 text-red-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {muted ? 'Muted' : 'Listening'}
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="flex border-b border-white/5"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {['transcript', 'ask'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab === 'transcript' ? 'Live Translation' : 'Ask a Question'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          ref={feedRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          {activeTab === 'transcript' ? (
            !sessionActive && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm text-center">
                <span className="material-symbols-outlined text-3xl mb-2">hearing</span>
                <p>Waiting for your visit to begin...</p>
                <p className="text-xs mt-1 opacity-60">
                  Start from the dashboard to see live translations here.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/70">
                      {msg.speaker}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-white/30">{msg.timestamp}</span>
                    )}
                  </div>
                  <p className="text-sm leading-snug text-white/90">{msg.translatedText}</p>
                  {msg.text !== msg.translatedText && (
                    <p className="text-xs text-white/40 italic">{msg.text}</p>
                  )}
                </div>
              ))
            )
          ) : (
            <>
              {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm text-center">
                  <span className="material-symbols-outlined text-3xl mb-2">chat</span>
                  <p>Ask about anything your doctor said</p>
                  <p className="text-xs mt-1 opacity-60">
                    e.g. "What does hypertension mean?"
                  </p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-lg px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600/20 text-emerald-200 ml-8'
                      : 'bg-white/5 text-white/90 mr-8'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Chat input (always visible on Ask tab) */}
        {activeTab === 'ask' && (
          <div
            className="px-3 py-2 border-t border-white/10"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What does that mean?"
                className="flex-1 bg-surface-800 text-white text-sm rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-emerald-400/50 placeholder-white/30"
              />
              <button
                onClick={handleAskQuestion}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              >
                Ask
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
