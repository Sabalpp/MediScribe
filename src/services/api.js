const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const WS_BASE = BASE_URL.replace(/^http/, 'ws')
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// REST helpers
// ---------------------------------------------------------------------------

async function jsonPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function jsonGet(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Sessions (real backend endpoints)
// ---------------------------------------------------------------------------

export async function createSession({ providerId = 'doctor_1', patientLanguage = 'es' } = {}) {
  return jsonPost('/api/sessions/', { provider_id: providerId, patient_language: patientLanguage })
}

export async function getSession(sessionId) {
  return jsonGet(`/api/sessions/${sessionId}/`)
}

export async function listSessions(providerId) {
  return jsonGet(`/api/sessions/?provider_id=${encodeURIComponent(providerId)}`)
}

export async function endSession(sessionId) {
  return jsonPost(`/api/sessions/${sessionId}/end/`, {})
}

export async function getSessionSummary(sessionId) {
  return jsonGet(`/api/sessions/${sessionId}/summary/`)
}

export async function getSessionMessages(sessionId) {
  return jsonGet(`/api/sessions/${sessionId}/messages/`)
}

export async function healthCheck() {
  return jsonGet('/api/health/')
}

// ---------------------------------------------------------------------------
// STT / TTS / Translate / Medical — with mock fallback
// ---------------------------------------------------------------------------

export async function speechToText({ audioBlob, language }) {
  if (!USE_MOCK) {
    const formData = new FormData()
    formData.append('audio', audioBlob)
    formData.append('language', language)
    const res = await fetch(`${BASE_URL}/api/stt`, { method: 'POST', body: formData })
    return res.json()
  }

  void audioBlob
  await delay(400)
  return {
    text: language === 'en'
      ? 'I think you should consider taking ibuprofen for the inflammation.'
      : 'Me duele mucho el pecho cuando respiro profundo.',
    confidence: 0.94,
    language,
  }
}

export async function textToSpeech({ text, targetLanguage, voice }) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage, voice }),
    })
    return res.blob()
  }

  void text; void targetLanguage; void voice
  await delay(500)
  return new Blob([], { type: 'audio/mpeg' })
}

export async function translate({ text, from, to }) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to }),
    })
    return res.json()
  }

  void text
  await delay(250)
  return {
    translated: to === 'en'
      ? 'My chest hurts a lot when I breathe deeply.'
      : 'Me duele mucho el pecho cuando respiro profundo.',
    from,
    to,
  }
}

export async function processMedical({ text, patientLanguage }) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/api/process-medical`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, patientLanguage }),
    })
    return res.json()
  }

  void text; void patientLanguage
  await delay(350)
  return {
    simplified: 'Your doctor is checking if your chest pain could be related to your heart or lungs.',
    terms: [
      { term: 'Pleuritic chest pain', definition: 'Pain in the chest that gets worse when you breathe in.' },
      { term: 'Pericarditis', definition: 'Swelling of the thin layer around your heart.' },
      { term: 'Troponin', definition: 'A blood test that checks if your heart muscle has been damaged.' },
    ],
    suggestions: [
      'Ask your doctor: "Is this something serious?"',
      'Ask your doctor: "What tests are you ordering and why?"',
      'Ask your doctor: "What should I watch out for at home?"',
    ],
  }
}

export async function ragQuery({ question, sessionContext }) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/api/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, sessionContext }),
    })
    return res.json()
  }

  void sessionContext
  await delay(600)

  const q = question.toLowerCase()
  let answer = 'Based on your visit, this is a common diagnostic step your doctor is taking to make sure everything is okay. If you have more questions, don\'t hesitate to ask your care team.'
  if (q.includes('hypertension') || q.includes('blood pressure')) {
    answer = 'Hypertension means your blood pressure is higher than normal. Your doctor may recommend lifestyle changes like eating less salt, exercising more, and possibly medication to help manage it.'
  } else if (q.includes('troponin') || q.includes('blood test')) {
    answer = 'Troponin is a protein released when heart muscle is damaged. Your doctor ordered this test to check if your heart is healthy. A normal result is reassuring.'
  } else if (q.includes('ekg') || q.includes('ecg') || q.includes('electrocardiogram')) {
    answer = 'An EKG (electrocardiogram) records the electrical activity of your heart. It\'s a painless test that helps your doctor see if your heart rhythm is normal.'
  }

  return {
    answer,
    sources: [
      { title: 'MedlinePlus – Patient Health Information', url: 'https://medlineplus.gov' },
      { title: 'Mayo Clinic – Patient Education', url: 'https://www.mayoclinic.org' },
    ],
  }
}

// ---------------------------------------------------------------------------
// WebSocket — real connection with mock fallback
// ---------------------------------------------------------------------------

export function connectSession({ sessionId, onMessage, onClose, onError, onOpen } = {}) {
  if (USE_MOCK) {
    return _connectSessionMock({ onMessage, onClose })
  }

  const wsUrl = `${WS_BASE}/ws/session/${sessionId}/`
  const ws = new WebSocket(wsUrl)
  ws.binaryType = 'arraybuffer'

  ws.onopen = () => onOpen?.()
  ws.onerror = (event) => onError?.(event)
  ws.onclose = (event) => onClose?.(event)

  ws.onmessage = (event) => {
    if (typeof event.data === 'string') {
      try { onMessage?.(JSON.parse(event.data)) } catch { /* ignore parse errors */ }
    }
  }

  return {
    ws,
    send: (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(typeof data === 'string' ? data : JSON.stringify(data))
      }
    },
    sendAudio: (blob, direction, patientLanguage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'audio_metadata', direction, patient_language: patientLanguage }))
        ws.send(blob)
      }
    },
    sendText: (text, patientLanguage) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'provider_text', text, patient_language: patientLanguage }))
      }
    },
    close: () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Mock fallback (for dev without Django backend running)
// ---------------------------------------------------------------------------

function _connectSessionMock({ onMessage, onClose } = {}) {
  let closed = false

  const mockMessages = [
    { type: 'patient_message', speaker: 'Patient', original: 'Me duele mucho el pecho.', translated: 'My chest hurts a lot.', medical_flags: { symptoms: ['chest pain'] }, patient_language: 'es' },
    { type: 'provider_message', speaker: 'Doctor', original: 'When did the pain start?', translated: '¿Cuándo empezó el dolor?', audio_base64: '', patient_language: 'es' },
    { type: 'patient_message', speaker: 'Patient', original: 'Empezó ayer por la noche.', translated: 'It started last night.', medical_flags: {}, patient_language: 'es' },
    { type: 'provider_message', speaker: 'Doctor', original: 'Does it get worse when you breathe deeply?', translated: '¿Empeora cuando respira profundo?', audio_base64: '', patient_language: 'es' },
    { type: 'patient_message', speaker: 'Patient', original: 'Sí, mucho peor.', translated: 'Yes, much worse.', medical_flags: { symptoms: ['pleuritic pain'] }, patient_language: 'es' },
    { type: 'provider_message', speaker: 'Doctor', original: "I'd like to order a troponin test and an EKG.", translated: 'Me gustaría ordenar una prueba de troponina y un EKG.', audio_base64: '', patient_language: 'es' },
  ]

  setTimeout(() => {
    if (!closed) onMessage?.({ type: 'connection_established', session_id: 'mock', message: 'Mock session connected.' })
  }, 100)

  let idx = 0
  const interval = setInterval(() => {
    if (closed || idx >= mockMessages.length) {
      clearInterval(interval)
      if (!closed) onClose?.()
      return
    }
    const msg = { ...mockMessages[idx], timestamp: new Date().toLocaleTimeString() }
    onMessage?.(msg)
    idx++
  }, 3000)

  return {
    ws: null,
    send: () => {},
    sendAudio: () => {},
    sendText: () => {},
    close: () => {
      closed = true
      clearInterval(interval)
      onClose?.()
    },
  }
}
