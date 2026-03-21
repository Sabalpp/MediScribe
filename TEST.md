# Testing Guide — MediScribe Real-Time Talk

## Quick Start

You need **two terminals** open, both inside the `HOOHACKS` folder.

### Terminal 1 — Backend

```bash
cd HOOHACKS
source .venv/bin/activate
python manage.py runserver 8000
```

You should see: `Listening on TCP address 127.0.0.1:8000`

### Terminal 2 — Frontend

```bash
cd HOOHACKS
npm run dev
```

You should see: `Local: http://localhost:5173/`

---

## Test 1: Health Check

Open your browser and go to:

```
http://localhost:8000/api/health/
```

You should see:

```json
{"status": "ok", "service": "VoiceBridge API"}
```

If you see this, the backend is alive.

---

## Test 2: Open the App

1. Open **http://localhost:5173/** in Chrome
2. Click **Login** (or go straight to `/dashboard`)
3. In the sidebar, click **Real-Time Talk**

You should see a dark page with a language dropdown and a "Start Session" button.

---

## Test 3: Start a Session

1. Pick a patient language (default is Spanish)
2. Click **Start Session**
3. The status should change from "Offline" to "Connected" then "Ready"

If it shows "Ready", the WebSocket connection to the backend is working.

---

## Test 4: Doctor Types a Message

1. With a session active, type in the text box at the bottom:
   ```
   How long have you had this chest pain?
   ```
2. Press Enter or click Send
3. You should see:
   - Status flashes "Translating..."
   - A green doctor bubble appears with:
     - Original English text
     - Spanish translation (e.g. "¿Desde cuándo tiene este dolor en el pecho?")
     - An audio player that auto-plays the translated speech

This tests: **Gemini translation + ElevenLabs TTS**

---

## Test 5: Patient Speaks Into Mic

1. Click the **Patient Mic** button (blue)
2. Allow microphone access when Chrome asks
3. Speak something in the patient language (e.g. Spanish): "Me duele el pecho cuando respiro"
4. Click **Stop Patient Mic**
5. You should see:
   - Status flashes "Transcribing..." then "Translating..."
   - A blue patient bubble appears with:
     - Original text in the patient's language
     - English translation
     - Medical flags (urgency level, symptoms, ICD-10 codes, suggested questions)

This tests: **ElevenLabs STT + Gemini translation + medical enrichment**

---

## Test 6: Doctor Speaks Into Mic

1. Click the **Doctor Mic** button (green)
2. Speak in English: "I need to run some tests on your heart"
3. Click **Stop Doctor Mic**
4. You should see:
   - Status flashes "Transcribing..." then "Translating..."
   - A green doctor bubble with English original + Spanish translation
   - Audio player auto-plays the translated speech

This tests: **ElevenLabs STT (English) + Gemini translation + ElevenLabs TTS**

---

## Test 7: End Session

1. Click **End Session** (red button)
2. Status should show "Disconnected"
3. The message history stays visible

---

## What Each Service Does

| Service | What it does | When it runs |
|---------|-------------|--------------|
| **ElevenLabs STT** | Converts mic audio → text | When patient or doctor presses mic |
| **Gemini** | Translates text + extracts medical info | Every message |
| **ElevenLabs TTS** | Converts translated text → audio | When doctor sends a message |

---

## Troubleshooting

### "Failed: fetch" or "Disconnected" immediately
- Make sure the backend is running on port 8000
- Check the backend terminal for errors

### "Mic error: NotAllowedError"
- Use Chrome (not Safari)
- Allow microphone access when prompted
- Make sure you're on `localhost` (not `127.0.0.1`)

### No translation appears / status stuck on "Translating..."
- Check the backend terminal for API errors
- Make sure `.env` has valid `GEMINI_API_KEY` and `ELEVENLABS_API_KEY`

### Audio doesn't play
- Check Chrome isn't blocking autoplay (click the speaker icon in the address bar)
- Make sure ElevenLabs API key is valid

### "Address already in use" when starting backend
- Run: `lsof -ti:8000 | xargs kill -9`
- Then restart the backend

---

## API Keys Needed

The `.env` file must have these set:

| Key | Service | Get it from |
|-----|---------|-------------|
| `GEMINI_API_KEY` | Google Gemini (translation) | https://aistudio.google.com/apikey |
| `ELEVENLABS_API_KEY` | ElevenLabs (speech) | https://elevenlabs.io/app/settings/api-keys |

Without these keys, the app returns mock/placeholder responses.

---

## Command-Line Quick Test (No Browser Needed)

If you just want to verify the backend pipeline works without opening the frontend:

```bash
source .venv/bin/activate

# Create a session
curl -s -X POST http://localhost:8000/api/sessions/ \
  -H "Content-Type: application/json" \
  -d '{"provider_id":"test","patient_language":"es"}' | python -m json.tool

# Check health
curl -s http://localhost:8000/api/health/ | python -m json.tool
```

For a full WebSocket test (needs `websockets` pip package):

```bash
python test_ws.py
```
