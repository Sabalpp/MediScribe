# MediScribe API Contracts

Base URL: `http://localhost:3001` (configurable via `VITE_API_BASE_URL` env var)

All endpoints expect and return JSON unless otherwise noted.

---

## POST `/api/stt`

Speech-to-text (ElevenLabs).

**Request** (`multipart/form-data`):

| Field      | Type   | Required | Description                        |
| ---------- | ------ | -------- | ---------------------------------- |
| `audio`    | Blob   | Yes      | Audio data (webm, wav, or mp3)     |
| `language` | string | Yes      | BCP-47 language code (e.g. `"es"`) |

**Response** (`application/json`):

```json
{
  "text": "Me duele mucho el pecho.",
  "confidence": 0.94,
  "language": "es"
}
```

---

## POST `/api/tts`

Text-to-speech (ElevenLabs).

**Request** (`application/json`):

```json
{
  "text": "My chest hurts a lot when I breathe deeply.",
  "targetLanguage": "en",
  "voice": "default"
}
```

| Field            | Type   | Required | Description                            |
| ---------------- | ------ | -------- | -------------------------------------- |
| `text`           | string | Yes      | Text to synthesize                     |
| `targetLanguage` | string | Yes      | BCP-47 language code for the output    |
| `voice`          | string | No       | Voice identifier (default: `"default"`) |

**Response**: Audio blob (`audio/mpeg`).

---

## POST `/api/translate`

Text translation.

**Request** (`application/json`):

```json
{
  "text": "Me duele mucho el pecho cuando respiro profundo.",
  "from": "es",
  "to": "en"
}
```

| Field  | Type   | Required | Description            |
| ------ | ------ | -------- | ---------------------- |
| `text` | string | Yes      | Text to translate      |
| `from` | string | Yes      | Source language code    |
| `to`   | string | Yes      | Target language code   |

**Response** (`application/json`):

```json
{
  "translated": "My chest hurts a lot when I breathe deeply.",
  "from": "es",
  "to": "en"
}
```

---

## POST `/api/process-medical`

Medical jargon processing (Gemini).

**Request** (`application/json`):

```json
{
  "text": "Patient presents with pleuritic chest pain, rule out pericarditis. Ordering troponin.",
  "patientLanguage": "es"
}
```

| Field             | Type   | Required | Description                       |
| ----------------- | ------ | -------- | --------------------------------- |
| `text`            | string | Yes      | Raw clinical text                 |
| `patientLanguage` | string | Yes      | Patient's preferred language code |

**Response** (`application/json`):

```json
{
  "simplified": "Your doctor is checking if your chest pain could be related to your heart or lungs.",
  "terms": [
    {
      "term": "Pleuritic chest pain",
      "definition": "Pain in the chest that gets worse when you breathe in."
    },
    {
      "term": "Pericarditis",
      "definition": "Swelling of the thin layer around your heart."
    },
    {
      "term": "Troponin",
      "definition": "A blood test that checks if your heart muscle has been damaged."
    }
  ],
  "suggestions": [
    "Ask your doctor: \"Is this something serious?\"",
    "Ask your doctor: \"What tests are you ordering and why?\""
  ]
}
```

---

## POST `/api/rag/query`

RAG-powered Q&A (Snowflake).

**Request** (`application/json`):

```json
{
  "question": "What does troponin mean?",
  "sessionContext": {}
}
```

| Field            | Type   | Required | Description                                          |
| ---------------- | ------ | -------- | ---------------------------------------------------- |
| `question`       | string | Yes      | Patient's question in plain language                  |
| `sessionContext` | object | No       | Current session data for context-aware answers        |

**Response** (`application/json`):

```json
{
  "answer": "Troponin is a protein released when heart muscle is damaged. Your doctor ordered this test to check if your heart is healthy.",
  "sources": [
    { "title": "MedlinePlus", "url": "https://medlineplus.gov" },
    { "title": "Mayo Clinic", "url": "https://www.mayoclinic.org" }
  ]
}
```

---

## WS `/ws/session`

Real-time bidirectional WebSocket for live visit streaming.

**Connection**: `ws://localhost:3001/ws/session`

### Client → Server messages

```json
{
  "type": "audio_chunk",
  "data": "<base64 encoded audio>",
  "language": "es",
  "timestamp": 1711046400000
}
```

### Server → Client messages

**Transcript event:**

```json
{
  "type": "transcript",
  "speaker": "Doctor",
  "text": "Does it get worse when you breathe deeply?",
  "translatedText": "¿Empeora cuando respira profundo?",
  "timestamp": "10:30:05 AM"
}
```

**Medical insight event:**

```json
{
  "type": "medical_insight",
  "simplified": "Your doctor wants to know if breathing makes the pain worse.",
  "terms": [
    { "term": "Pleuritic", "definition": "Related to breathing pain" }
  ]
}
```

**Session end event:**

```json
{
  "type": "session_end",
  "summary": "Visit summary text...",
  "duration_seconds": 420
}
```
