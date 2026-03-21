# MediScribe (VoiceBridge) — HooHacks 2026

Real-time AI medical interpreter. Patient speaks their language, doctor sees English + medical flags. Doctor responds, patient hears their language.

## What You Need

- Python 3.9+ (for the backend)
- Node.js 18+ (for the frontend)
- The `.env` file with API keys (ask Sabal)

## Quick Start — Run Both Together

You need **two terminal windows** open at the same time.

### Terminal 1: Backend (Django)

```bash
cd HOOHACKS
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill in your API keys
python manage.py migrate
python manage.py runserver 8000
```

Backend runs at **http://localhost:8000**

### Terminal 2: Frontend (React)

```bash
cd HOOHACKS
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### That's it!

Open **http://localhost:5173** in your browser. The frontend talks to the backend automatically.

---

## API Keys Needed in `.env`

| Key | Where to get it |
|-----|----------------|
| `GEMINI_API_KEY` | Google AI Studio |
| `ELEVENLABS_API_KEY` | ElevenLabs dashboard |
| `SNOWFLAKE_ACCOUNT` | Snowflake console (optional) |
| `SNOWFLAKE_USER` | Snowflake console (optional) |
| `SNOWFLAKE_PASSWORD` | Snowflake console (optional) |

Everything works without Snowflake — it just skips the RAG validation step.

---

## How It Works

1. Doctor starts a session, picks the patient's language
2. Patient speaks into the mic → audio goes to backend via WebSocket
3. Backend: ElevenLabs transcribes → Gemini translates + extracts medical flags → Snowflake validates
4. Doctor sees: English translation + medical terms + suggested questions
5. Doctor types a response → Gemini translates to patient's language → ElevenLabs speaks it back

---

## Backend API

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/api/health/` | Health check |
| POST | `/api/sessions/` | Create a new session |
| GET | `/api/sessions/<id>/` | Get session + transcript |
| POST | `/api/sessions/<id>/end/` | End session, generate summary |
| GET | `/api/sessions/<id>/summary/` | Get AI summary |

### WebSocket

```
ws://localhost:8000/ws/session/<session_id>/
```

---

## Project Structure

```
HOOHACKS/
├── core/                    # Django project config
│   ├── settings.py
│   ├── asgi.py
│   └── urls.py
├── interpreter/             # Backend app (all AI logic)
│   ├── consumers.py         # WebSocket handler
│   ├── views.py             # REST endpoints
│   ├── gemini_client.py     # Gemini translation
│   ├── elevenlabs_client.py # TTS
│   ├── snowflake_client.py  # RAG validation
│   └── models.py            # DB models
├── src/                     # React frontend
│   ├── pages/               # Landing, Login, Dashboard
│   ├── services/api.js      # API calls + WebSocket
│   └── components/          # Shared UI components
├── manage.py
├── package.json
└── vite.config.js
```

---

## Supported Languages

| Code | Language |
|------|----------|
| `es` | Spanish |
| `zh` | Mandarin Chinese |
| `vi` | Vietnamese |
| `fr` | French |
| `pt` | Portuguese |
| `ar` | Arabic |
| `hi` | Hindi |

---

## Team

- **Sabal** — Architecture + Backend
- **Hung** — Co-Architect + Snowflake RAG
- **Teammate 3** — Frontend pages (Landing, Login, Dashboard)
- **Teammate 4** — Live consultation UI + overlay
