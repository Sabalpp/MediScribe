const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * POST /api/stt — Speech-to-text via ElevenLabs
 * @param {{ audioBlob: Blob, language: string }} params
 * @returns {Promise<{ text: string, confidence: number, language: string }>}
 */
export async function speechToText({ audioBlob, language }) {
  // TODO: Replace stub with real API call
  // const formData = new FormData()
  // formData.append('audio', audioBlob)
  // formData.append('language', language)
  // const res = await fetch(`${BASE_URL}/api/stt`, { method: 'POST', body: formData })
  // return res.json()

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

/**
 * POST /api/tts — Text-to-speech via ElevenLabs
 * @param {{ text: string, targetLanguage: string, voice?: string }} params
 * @returns {Promise<Blob>}
 */
export async function textToSpeech({ text, targetLanguage, voice }) {
  // TODO: Replace stub with real API call
  // const res = await fetch(`${BASE_URL}/api/tts`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text, targetLanguage, voice }),
  // })
  // return res.blob()

  void text; void targetLanguage; void voice
  await delay(500)
  return new Blob([], { type: 'audio/mpeg' })
}

/**
 * POST /api/translate — Text translation
 * @param {{ text: string, from: string, to: string }} params
 * @returns {Promise<{ translated: string, from: string, to: string }>}
 */
export async function translate({ text, from, to }) {
  // TODO: Replace stub with real API call
  // const res = await fetch(`${BASE_URL}/api/translate`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text, from, to }),
  // })
  // return res.json()

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

/**
 * POST /api/process-medical — Medical jargon processing via Gemini
 * @param {{ text: string, patientLanguage: string }} params
 * @returns {Promise<{ simplified: string, terms: Array<{ term: string, definition: string }>, suggestions: string[] }>}
 */
export async function processMedical({ text, patientLanguage }) {
  // TODO: Replace stub with real API call
  // const res = await fetch(`${BASE_URL}/api/process-medical`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text, patientLanguage }),
  // })
  // return res.json()

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

/**
 * POST /api/rag/query — RAG-powered Q&A via Snowflake
 * @param {{ question: string, sessionContext: any }} params
 * @returns {Promise<{ answer: string, sources: Array<{ title: string, url?: string }> }>}
 */
export async function ragQuery({ question, sessionContext }) {
  // TODO: Replace stub with real API call
  // const res = await fetch(`${BASE_URL}/api/rag/query`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ question, sessionContext }),
  // })
  // return res.json()

  void sessionContext
  await delay(600)

  const answers = {
    default: 'Based on your visit, this is a common diagnostic step your doctor is taking to make sure everything is okay. If you have more questions, don\'t hesitate to ask your care team.',
  }

  const q = question.toLowerCase()
  let answer = answers.default
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

/**
 * WS /ws/session — Real-time bidirectional session
 * In production, this opens a WebSocket. The stub simulates it.
 *
 * @param {{ url?: string, onMessage: (data: object) => void, onClose?: () => void }} params
 * @returns {{ send: (data: any) => void, close: () => void }}
 */
export function connectSession({ url, onMessage, onClose } = {}) {
  // TODO: Replace stub with real WebSocket
  // const ws = new WebSocket(url || `${BASE_URL.replace('http', 'ws')}/ws/session`)
  // ws.onmessage = (e) => onMessage(JSON.parse(e.data))
  // ws.onclose = onClose
  // return { send: (data) => ws.send(JSON.stringify(data)), close: () => ws.close() }

  void url
  let closed = false

  const mockMessages = [
    { speaker: 'Doctor', text: 'Good morning, how are you feeling today?', translatedText: 'Buenos días, ¿cómo se siente hoy?' },
    { speaker: 'Patient', text: 'Me duele mucho el pecho.', translatedText: 'My chest hurts a lot.' },
    { speaker: 'Doctor', text: 'When did the pain start?', translatedText: '¿Cuándo empezó el dolor?' },
    { speaker: 'Patient', text: 'Empezó ayer por la noche.', translatedText: 'It started last night.' },
    { speaker: 'Doctor', text: 'Does it get worse when you breathe deeply?', translatedText: '¿Empeora cuando respira profundo?' },
    { speaker: 'Patient', text: 'Sí, mucho peor.', translatedText: 'Yes, much worse.' },
    { speaker: 'Doctor', text: "I'd like to order a troponin test and an EKG.", translatedText: 'Me gustaría ordenar una prueba de troponina y un EKG.' },
  ]

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
    send: () => {},
    close: () => {
      closed = true
      clearInterval(interval)
      onClose?.()
    },
  }
}
