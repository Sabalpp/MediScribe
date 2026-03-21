"""
consumers.py

Django Channels WebSocket consumer.
This is the real-time heart of VoiceBridge.

Two message flows:

1. PATIENT AUDIO PATH (patient speaks → doctor sees English + medical flags):
   Frontend sends: JSON metadata frame → then raw audio bytes
   Backend:
     - Runs audio through ElevenLabs STT (speech-to-text)
     - Sends transcript to Gemini for translation + medical flag extraction
     - Runs flags through Snowflake RAG validation
     - Saves Message to DB
     - Sends result back to frontend via WebSocket

2. PROVIDER TEXT PATH (doctor types/speaks → patient hears native language):
   Frontend sends: JSON with type="provider_text" + text + patient_language
   Backend:
     - Sends text to Gemini for translation to patient language
     - Sends translated text to ElevenLabs for TTS
     - Saves Message to DB
     - Sends translated text + base64 audio back to frontend

WebSocket URL: ws://localhost:8000/ws/session/<session_id>/
"""

import json
import logging
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from .gemini_client import translate_patient_utterance, translate_provider_utterance
from .elevenlabs_client import synthesize_speech
from .snowflake_client import validate_medical_terms

logger = logging.getLogger(__name__)


class InterpreterConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.session_id = self.scope["url_route"]["kwargs"]["session_id"]
        self.patient_language = "es"  # default, overridden by first message
        self._pending_direction = None
        self._pending_language = None

        # Join a channel group so multiple browser tabs can listen to same session
        self.group_name = f"session_{self.session_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(f"WebSocket connected: session={self.session_id}")

        # Confirm connection to frontend
        await self.send(json.dumps({
            "type": "connection_established",
            "session_id": self.session_id,
            "message": "VoiceBridge connected. Ready to interpret.",
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"WebSocket disconnected: session={self.session_id}, code={close_code}")

    async def receive(self, text_data=None, bytes_data=None):
        """
        Two types of incoming messages:
        - text_data: JSON control/metadata frames
        - bytes_data: raw audio from patient's microphone
        """

        # --- TEXT FRAME: control messages from frontend ---
        if text_data:
            try:
                payload = json.loads(text_data)
            except json.JSONDecodeError:
                await self._send_error("Invalid JSON in text frame")
                return

            msg_type = payload.get("type")

            if msg_type == "audio_metadata":
                # Frontend sends this just before an audio chunk
                # so we know what language and direction the next binary frame is
                self._pending_direction = payload.get("direction", "patient_to_provider")
                self._pending_language = payload.get("patient_language", "es")
                self.patient_language = self._pending_language

            elif msg_type == "provider_text":
                # Doctor typed a message — translate + TTS it
                await self._handle_provider_text(payload)

            elif msg_type == "provider_audio_transcript":
                # Doctor spoke and frontend already ran STT (e.g. browser Web Speech API)
                # We just need to translate + TTS
                text = payload.get("text", "")
                if text:
                    await self._handle_provider_text({
                        "text": text,
                        "patient_language": payload.get("patient_language", self.patient_language),
                    })

            elif msg_type == "ping":
                await self.send(json.dumps({"type": "pong"}))

            else:
                logger.warning(f"Unknown message type: {msg_type}")

        # --- BINARY FRAME: patient audio chunk ---
        elif bytes_data:
            direction = self._pending_direction or "patient_to_provider"
            language = self._pending_language or self.patient_language
            await self._handle_patient_audio(bytes_data, language)

    # -----------------------------------------------------------------------
    # Patient audio pipeline
    # -----------------------------------------------------------------------

    async def _handle_patient_audio(self, audio_bytes: bytes, patient_language: str):
        """
        Receives raw audio from patient's mic.
        1. Transcribes via ElevenLabs STT
        2. Translates + extracts medical flags via Gemini
        3. Validates via Snowflake RAG
        4. Saves to DB
        5. Broadcasts result
        """
        # Step 1: Transcribe audio → text (ElevenLabs STT)
        original_text = await self._transcribe_audio(audio_bytes, patient_language)
        if not original_text or len(original_text.strip()) < 2:
            return  # silence / noise, ignore

        # Send "typing indicator" so doctor sees something happening immediately
        await self.send(json.dumps({
            "type": "transcribing",
            "message": "Transcribing patient...",
        }))

        # Step 2: Gemini translation + medical flag extraction
        result = await translate_patient_utterance(original_text, patient_language)
        translated = result.get("translated", "")
        medical_flags = result.get("medical_flags", {})

        # Step 3: Snowflake RAG validation (runs in parallel with DB save)
        symptoms = medical_flags.get("symptoms", [])
        body_parts = medical_flags.get("body_parts", [])
        rag_result = await validate_medical_terms(symptoms, body_parts)

        # Merge RAG enrichment into flags
        medical_flags["rag_validated"] = rag_result.get("validated", False)
        medical_flags["icd_suggestions"] = rag_result.get("icd_suggestions", [])
        medical_flags["enriched_symptoms"] = rag_result.get("enriched_symptoms", symptoms)

        # Step 4: Save to DB
        await self._save_message(
            direction="patient_to_provider",
            original_text=result.get("original", original_text),
            translated_text=translated,
            medical_flags=medical_flags,
            rag_validated=rag_result.get("validated", False),
        )

        # Step 5: Send back to ALL clients in this session (doctor + patient views)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast_patient_message",
                "original": result.get("original", original_text),
                "translated": translated,
                "medical_flags": medical_flags,
                "patient_language": patient_language,
            },
        )

    async def broadcast_patient_message(self, event):
        """Receives group_send and forwards to this WebSocket client."""
        await self.send(json.dumps({
            "type": "patient_message",
            "original": event["original"],
            "translated": event["translated"],
            "medical_flags": event["medical_flags"],
            "patient_language": event["patient_language"],
        }))

    # -----------------------------------------------------------------------
    # Provider text pipeline
    # -----------------------------------------------------------------------

    async def _handle_provider_text(self, payload: dict):
        """
        Provider typed or spoke a message.
        1. Translate to patient language via Gemini
        2. Synthesize TTS via ElevenLabs
        3. Save to DB
        4. Broadcast translated text + audio
        """
        text = payload.get("text", "").strip()
        patient_language = payload.get("patient_language", self.patient_language)
        if not text:
            return

        await self.send(json.dumps({"type": "translating", "message": "Translating..."}))

        # Step 1: Gemini translation
        result = await translate_provider_utterance(text, patient_language)
        translated = result.get("translated", "")

        # Step 2: ElevenLabs TTS (run in parallel with DB save)
        audio_b64, _ = await asyncio.gather(
            synthesize_speech(translated, patient_language),
            self._save_message(
                direction="provider_to_patient",
                original_text=text,
                translated_text=translated,
                medical_flags={},
                rag_validated=False,
            ),
        )

        # Step 3: Broadcast to all session clients
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast_provider_message",
                "original": text,
                "translated": translated,
                "audio_base64": audio_b64,
                "patient_language": patient_language,
            },
        )

    async def broadcast_provider_message(self, event):
        await self.send(json.dumps({
            "type": "provider_message",
            "original": event["original"],
            "translated": event["translated"],
            "audio_base64": event["audio_base64"],
            "patient_language": event["patient_language"],
        }))

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------

    async def _transcribe_audio(self, audio_bytes: bytes, language: str) -> str:
        """
        Transcribe audio bytes to text using ElevenLabs STT API.
        Falls back to a placeholder if API key not set.
        """
        import httpx, os
        api_key = os.getenv("ELEVENLABS_API_KEY", "")
        if not api_key:
            logger.warning("ELEVENLABS_API_KEY not set — cannot transcribe audio")
            return ""

        try:
            lang_map = {
                "es": "es", "zh": "zh", "vi": "vi",
                "fr": "fr", "pt": "pt", "ar": "ar", "hi": "hi", "en": "en"
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    "https://api.elevenlabs.io/v1/speech-to-text",
                    headers={"xi-api-key": api_key},
                    files={"audio": ("audio.webm", audio_bytes, "audio/webm")},
                    data={
                        "model_id": "scribe_v1",
                        "language_code": lang_map.get(language, language),
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data.get("text", "")
        except Exception as e:
            logger.error(f"ElevenLabs STT error: {e}")
            return ""

    async def _save_message(
        self,
        direction: str,
        original_text: str,
        translated_text: str,
        medical_flags: dict,
        rag_validated: bool,
    ):
        """Save message to DB using sync_to_async to avoid blocking the event loop."""
        from asgiref.sync import sync_to_async
        from .models import Session, Message

        @sync_to_async
        def _write():
            try:
                session = Session.objects.get(id=self.session_id)
                Message.objects.create(
                    session=session,
                    direction=direction,
                    original_text=original_text,
                    translated_text=translated_text,
                    medical_flags=medical_flags,
                    rag_validated=rag_validated,
                )
            except Session.DoesNotExist:
                logger.error(f"Session {self.session_id} not found — message not saved")
            except Exception as e:
                logger.error(f"DB save error: {e}")

        await _write()

    async def _send_error(self, message: str):
        await self.send(json.dumps({"type": "error", "message": message}))
