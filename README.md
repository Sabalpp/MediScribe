# VoiceBridge — Backend

Real-time AI medical interpreter. Patient speaks their language, doctor sees English + medical flags. Doctor responds, patient hears their language.

---

## Quick Start (No Docker needed)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up environment
cp .env.example .env
# Fill in: GEMINI_API_KEY, ELEVENLABS_API_KEY (minimum to run)

# 3. Run migrations
python manage.py migrate

# 4. Start the server (HTTP + WebSocket)
daphne -p 8000 core.asgi:application

# OR for dev (HTTP only, no WebSocket):
python manage.py runserver
```

The server runs at `http://localhost:8000`.

---

## With Docker (Postgres + Redis)

```bash
# Start Postgres + Redis
docker compose up -d

# Update .env:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voicebridge
REDIS_URL=redis://localhost:6379

python manage.py migrate
daphne -p 8000 core.asgi:application
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | YES | Google AI Studio key |
| `ELEVENLABS_API_KEY` | YES | ElevenLabs key |
| `SNOWFLAKE_ACCOUNT` | No | Snowflake RAG (skipped if blank) |
| `SNOWFLAKE_USER` | No | |
| `SNOWFLAKE_PASSWORD` | No | |
| `SNOWFLAKE_DATABASE` | No | |
| `SNOWFLAKE_SCHEMA` | No | |
| `SNOWFLAKE_WAREHOUSE` | No | |
| `DATABASE_URL` | No | Falls back to SQLite |
| `REDIS_URL` | No | Falls back to in-memory channels |
| `SKIP_AUTH` | No | Default `True` for local dev |
| `AUTH0_DOMAIN` | No | Required only if `SKIP_AUTH=False` |

---

## API Reference

### REST

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health/` | Health check |
| POST | `/api/sessions/` | Create session |
| GET | `/api/sessions/?provider_id=xxx` | List sessions |
| GET | `/api/sessions/<id>/` | Session detail + transcript |
| POST | `/api/sessions/<id>/end/` | End session + generate summary |
| GET | `/api/sessions/<id>/summary/` | Get AI summary |
| GET | `/api/sessions/<id>/messages/` | Get all messages |

#### Create session
```json
POST /api/sessions/
{
  "provider_id": "auth0|abc123",
  "patient_language": "es"
}
```
Response: `{ "id": "<uuid>", "patient_language": "es", ... }`

### WebSocket

```
ws://localhost:8000/ws/session/<session_id>/
```

#### Patient audio path (browser mic → backend)
```js
// Step 1: Send metadata frame
ws.send(JSON.stringify({
  type: "audio_metadata",
  direction: "patient_to_provider",
  patient_language: "es"
}))

// Step 2: Send audio binary
ws.send(audioBlob)  // webm/opus from MediaRecorder
```

Backend responds:
```json
{
  "type": "patient_message",
  "original": "Me duele el pecho",
  "translated": "My chest hurts",
  "medical_flags": {
    "symptoms": ["chest pain"],
    "urgency": "high",
    "body_parts": ["chest"],
    "suggested_questions": ["How long has this been happening?"]
  },
  "patient_language": "es"
}
```

#### Provider text path (doctor types → patient hears)
```js
ws.send(JSON.stringify({
  type: "provider_text",
  text: "How long have you had this pain?",
  patient_language: "es"
}))
```

Backend responds:
```json
{
  "type": "provider_message",
  "original": "How long have you had this pain?",
  "translated": "¿Cuánto tiempo lleva con este dolor?",
  "audio_base64": "<base64 MP3 — play this on patient's device>",
  "patient_language": "es"
}
```

#### Play audio on patient device
```js
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === "provider_message" && data.audio_base64) {
    const audio = new Audio("data:audio/mpeg;base64," + data.audio_base64)
    audio.play()
  }
}
```

---

## File Structure

```
voicebridge/
├── core/
│   ├── settings.py         # All config, env-driven
│   ├── asgi.py             # Channels entry point
│   └── urls.py             # Routes /api/ to interpreter
├── interpreter/
│   ├── models.py           # Session + Message
│   ├── views.py            # REST endpoints
│   ├── serializers.py      # DRF serializers
│   ├── consumers.py        # WebSocket consumer (real-time pipeline)
│   ├── routing.py          # WebSocket URL patterns
│   ├── gemini_client.py    # Gemini translation + summarization
│   ├── elevenlabs_client.py# TTS synthesis
│   ├── snowflake_client.py # RAG medical validation
│   ├── auth.py             # Auth0 JWT validation
│   ├── admin.py            # Django admin
│   └── urls.py             # REST URL patterns
├── docker-compose.yml      # Postgres + Redis
├── requirements.txt
└── .env.example
```

---

## Supported Languages

| Code | Language |
|---|---|
| `es` | Spanish |
| `zh` | Mandarin Chinese |
| `vi` | Vietnamese |
| `fr` | French |
| `pt` | Portuguese |
| `ar` | Arabic |
| `hi` | Hindi |

---

## For Sabal (Frontend Integration Notes)

1. **Start a session:** `POST /api/sessions/` with `provider_id` and `patient_language`
2. **Open WebSocket** using the `id` from the response
3. **Patient flow:** Send `audio_metadata` JSON → then raw audio `Blob` from `MediaRecorder`
4. **Provider flow:** Send `provider_text` JSON with the doctor's message
5. **End session:** `POST /api/sessions/<id>/end/` — triggers Gemini summary generation
6. **Get summary:** `GET /api/sessions/<id>/summary/`

Auth is bypassed by default (`SKIP_AUTH=True`). Pass `X-Provider-Id: your_id` header instead of a real JWT during local development.
