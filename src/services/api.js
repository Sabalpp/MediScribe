const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const WS_BASE = BASE_URL.replace(/^http/, 'ws')

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
// Sessions
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

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function healthCheck() {
  return jsonGet('/api/health/')
}

// ---------------------------------------------------------------------------
// WebSocket — real-time bidirectional session
// ---------------------------------------------------------------------------

export function connectSession({ sessionId, onMessage, onOpen, onClose, onError } = {}) {
  const ws = new WebSocket(`${WS_BASE}/ws/session/${sessionId}/`)

  ws.onopen = () => onOpen?.()
  ws.onclose = () => onClose?.()
  ws.onerror = (e) => onError?.(e)
  ws.onmessage = (e) => {
    try {
      onMessage?.(JSON.parse(e.data))
    } catch {
      onMessage?.(e.data)
    }
  }

  return {
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
    close: () => ws.close(),
    ws,
  }
}
