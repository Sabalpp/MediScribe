# Live Microphone Test — Step by Step

This tests the full real-time loop: you speak into your mic as a patient, the app transcribes, translates, and shows medical flags to the doctor. Then the doctor types back and the patient hears it spoken in their language.

---

## Before You Start

Make sure you have:
- The `.env` file with API keys (ask Sabal if you don't have it)
- Python dependencies installed (`pip install -r requirements.txt`)
- Migrations run (`python manage.py migrate`)

---

## Step 1: Start the Backend

Open a terminal:

```
cd HOOHACKS
source .venv/bin/activate
python manage.py runserver 8000
```

Wait until you see:

```
Listening on TCP address 127.0.0.1:8000
```

Leave this terminal open.

---

## Step 2: Open the Mic Test Page

Open the file `test_mic.html` in **Google Chrome**.

You can do this by:
- Double-clicking the file in Finder
- Or dragging it into a Chrome window
- Or running `open test_mic.html` in a new terminal

You should see a dark page titled **"MediScribe — Live Mic Test"**.

---

## Step 3: Pick the Patient's Language

Use the dropdown at the top to select what language the patient speaks. Default is Spanish.

---

## Step 4: Record as the Patient

1. Click the red **"Start Recording (Patient Mic)"** button
2. Chrome will ask for microphone permission — click **Allow**
3. The button turns green and says **"Stop Recording"**
4. **Speak into your mic** as the patient. Examples:
   - Spanish: "Me duele mucho la cabeza y tengo náuseas"
   - Spanish: "Tengo dolor en el pecho cuando respiro"
   - French: "J'ai mal à la tête depuis hier"
   - Or just speak in English to test the flow
5. Click **"Stop Recording"** when you're done

---

## Step 5: Watch the Results

After you stop recording, you'll see messages appear in the conversation panel:

1. **"Sent X KB of audio"** — your recording was sent to the backend
2. **"Transcribing patient audio..."** — ElevenLabs is converting speech to text
3. **Patient message appears** showing:
   - The original text (what you said)
   - The English translation
   - Medical flags: symptoms, urgency level, body parts, suggested follow-up questions

---

## Step 6: Respond as the Doctor

1. Type an English response in the text box at the bottom. Example:
   - "How long have you had this headache?"
   - "Are you taking any medications?"
   - "On a scale of 1 to 10, how bad is the pain?"
2. Press **Enter** or click **"Send as Doctor"**
3. You'll see:
   - The translated text in the patient's language
   - An audio player that **auto-plays** the translation so the patient can hear it

---

## Step 7: Repeat

Keep going back and forth:
- Click Record → speak as patient → Stop → see translation + flags
- Type as doctor → see translation + hear audio

This is the full demo loop.

---

## Troubleshooting

| What you see | What's wrong | Fix |
|---|---|---|
| "Backend not running" | Server isn't started | Run `python manage.py runserver 8000` |
| "Mic error" | Browser blocked mic | Click the lock icon in Chrome's address bar → allow microphone |
| Nothing happens after recording | Audio too short or silent | Speak clearly for at least 2-3 seconds |
| Translation says "(mock)" | Gemini API key issue | Check `.env` has the right `GEMINI_API_KEY` |
| No audio plays for doctor response | ElevenLabs key issue | Check `.env` has the right `ELEVENLABS_API_KEY` |
| "Address already in use" | Old server still running | Run `lsof -ti:8000 \| xargs kill -9` then start again |

---

## What's Happening Under the Hood

```
You speak into mic
    ↓
Browser records audio (webm/opus via MediaRecorder)
    ↓
Audio sent to backend over WebSocket
    ↓
ElevenLabs transcribes speech → text
    ↓
Gemini translates to English + extracts medical flags
    ↓
Results sent back to browser over WebSocket
    ↓
You see: original text, translation, symptoms, urgency, suggested questions

Doctor types a response
    ↓
Sent to backend over WebSocket
    ↓
Gemini translates English → patient's language
    ↓
ElevenLabs converts translation to speech (MP3)
    ↓
Audio sent back to browser over WebSocket
    ↓
Patient hears the response in their language
```
