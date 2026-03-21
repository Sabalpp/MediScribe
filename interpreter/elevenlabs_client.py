"""
elevenlabs_client.py

ElevenLabs text-to-speech integration.
- synthesize_speech: text + language → base64 audio (MP3)

Uses the multilingual_v2 model which handles Spanish, Mandarin, Vietnamese
naturally without needing separate voice configs per language.
"""

import os
import base64
import asyncio
import logging
import httpx

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# Voice IDs — these are ElevenLabs pre-built voices that perform well
# in each language with multilingual_v2.
# Sabal: swap these out for any voice IDs you prefer from ElevenLabs voice library.
VOICE_MAP = {
    "es": "XB0fDUnXU5powFXDhCwa",  # Charlotte — natural Spanish
    "zh": "jsCqWAovK2LkecY7zXl4",  # Freya — Mandarin
    "vi": "EXAVITQu4vr4xnSDxMaL",  # Sarah — Vietnamese
    "fr": "XB0fDUnXU5powFXDhCwa",  # Charlotte handles French well too
    "pt": "XB0fDUnXU5powFXDhCwa",
    "ar": "jsCqWAovK2LkecY7zXl4",
    "hi": "EXAVITQu4vr4xnSDxMaL",
    "en": "JBFqnCBsd6RMkjVDRZzb",  # George — English (for doctor TTS)
}

TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
HEADERS = {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
    "Accept": "audio/mpeg",
}


async def synthesize_speech(text: str, language: str) -> str:
    """
    Convert text to speech using ElevenLabs multilingual_v2.

    Args:
        text: The text to synthesize (in the target language)
        language: Language code ('es', 'zh', 'vi', 'en', etc.)

    Returns:
        Base64-encoded MP3 audio string (ready to send over WebSocket)
        Returns empty string on failure so the frontend can degrade gracefully.
    """
    if not ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY not set — skipping TTS")
        return ""

    voice_id = VOICE_MAP.get(language, VOICE_MAP["en"])
    url = TTS_URL.format(voice_id=voice_id)

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,          # Balanced — not too robotic, not too variable
            "similarity_boost": 0.8,   # Stay close to the base voice character
            "style": 0.2,              # Slight expressiveness — appropriate for medical
            "use_speaker_boost": True,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                headers={**HEADERS, "xi-api-key": ELEVENLABS_API_KEY},
                json=payload,
            )
            response.raise_for_status()
            audio_bytes = response.content
            return base64.b64encode(audio_bytes).decode("utf-8")
    except httpx.HTTPStatusError as e:
        logger.error(f"ElevenLabs HTTP error {e.response.status_code}: {e.response.text[:200]}")
        return ""
    except httpx.TimeoutException:
        logger.error("ElevenLabs TTS timed out")
        return ""
    except Exception as e:
        logger.error(f"ElevenLabs unexpected error: {e}")
        return ""


async def synthesize_speech_stream(text: str, language: str):
    """
    Streaming TTS — yields audio chunks as they arrive from ElevenLabs.
    Use this for lower perceived latency on longer provider responses.
    The frontend should start playing the first chunk immediately.

    Yields: bytes chunks of MP3 audio
    """
    if not ELEVENLABS_API_KEY:
        return

    voice_id = VOICE_MAP.get(language, VOICE_MAP["en"])
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream(
                "POST",
                url,
                headers={**HEADERS, "xi-api-key": ELEVENLABS_API_KEY},
                json=payload,
            ) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk
    except Exception as e:
        logger.error(f"ElevenLabs stream error: {e}")
