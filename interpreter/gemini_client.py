"""
gemini_client.py

All Gemini API interactions via the current google-genai SDK.
- translate_patient_utterance: text → {original, translated, medical_flags}
- translate_provider_utterance: English text → patient language text
- generate_session_summary: full transcript → structured medical summary
"""

import os
import json
import asyncio
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Lazy client — instantiated on first use
_client = None

def get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client

LANG_NAMES = {
    "es": "Spanish",
    "zh": "Mandarin Chinese",
    "vi": "Vietnamese",
    "fr": "French",
    "pt": "Portuguese",
    "ar": "Arabic",
    "hi": "Hindi",
}

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def _parse_json_response(raw: str, fallback: dict) -> dict:
    """Strip markdown fences and parse JSON. Returns fallback on failure."""
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Gemini JSON parse error: {e} | raw: {raw[:200]}")
        return fallback


# ---------------------------------------------------------------------------
# Patient → Provider
# ---------------------------------------------------------------------------

async def translate_patient_utterance(text: str, patient_language: str) -> dict:
    """
    Translates patient speech to English and extracts medical flags.

    Returns:
    {
        "original": "Me duele el pecho cuando respiro",
        "translated": "My chest hurts when I breathe",
        "medical_flags": {
            "symptoms": ["chest pain", "pain on breathing"],
            "urgency": "high",
            "body_parts": ["chest"],
            "medications": [],
            "suggested_questions": ["How long has this been happening?"]
        }
    }
    """
    lang_name = LANG_NAMES.get(patient_language, patient_language)
    client = get_client()

    prompt = f"""You are an expert real-time medical interpreter.

The patient is speaking {lang_name}. Their utterance is:
"{text}"

Tasks:
1. Clean up any transcription artifacts in the original
2. Translate accurately to English, preserving medical meaning
3. Extract medical flags to assist the doctor

Respond ONLY with valid JSON, no markdown, no explanation:
{{
  "original": "<cleaned original in {lang_name}>",
  "translated": "<accurate English translation>",
  "medical_flags": {{
    "symptoms": ["<symptoms mentioned>"],
    "urgency": "<low|medium|high>",
    "body_parts": ["<body parts mentioned>"],
    "medications": ["<medications mentioned>"],
    "suggested_questions": ["<1-2 follow-up questions for the doctor>"]
  }}
}}"""

    fallback = {
        "original": text,
        "translated": f"(mock) {text}",
        "medical_flags": {
            "symptoms": ["unspecified symptom"],
            "urgency": "medium",
            "body_parts": [],
            "medications": [],
            "suggested_questions": ["Can you describe the pain?", "When did it start?"],
        },
    }

    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — returning mock patient translation")
        return fallback

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=1024,
            ),
        )
        return _parse_json_response(response.text, fallback)
    except Exception as e:
        logger.error(f"Gemini patient translation error: {e}")
        return fallback


# ---------------------------------------------------------------------------
# Provider → Patient
# ---------------------------------------------------------------------------

async def translate_provider_utterance(text: str, patient_language: str) -> dict:
    """
    Translates provider's English into the patient's language.
    Uses plain, warm language appropriate for a patient.

    Returns:
    {
        "original": "How long have you had this pain?",
        "translated": "¿Cuánto tiempo lleva con este dolor?"
    }
    """
    lang_name = LANG_NAMES.get(patient_language, patient_language)
    client = get_client()

    prompt = f"""You are a medical interpreter translating from English to {lang_name}.

The doctor said: "{text}"

Translate using:
- Clear, plain language a patient can understand (no jargon)
- Warm, reassuring tone
- Exact clinical meaning — do not add or remove content

Respond ONLY with valid JSON:
{{
  "original": "{text}",
  "translated": "<translation in {lang_name}>"
}}"""

    fallback = {"original": text, "translated": f"(mock) {text}"}

    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — returning mock provider translation")
        return fallback

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=512),
        )
        return _parse_json_response(response.text, fallback)
    except Exception as e:
        logger.error(f"Gemini provider translation error: {e}")
        return fallback


# ---------------------------------------------------------------------------
# Session summary — called when session ends
# ---------------------------------------------------------------------------

async def generate_session_summary(messages: list[dict], patient_language: str) -> str:
    """
    Takes the full transcript and generates a structured clinical summary.

    messages: [{"direction": ..., "original": ..., "translated": ...}, ...]
    Returns plain-text summary string.
    """
    if not messages:
        return "No messages recorded in this session."

    lang_name = LANG_NAMES.get(patient_language, "the patient's language")
    client = get_client()

    lines = []
    for m in messages:
        if m["direction"] == "patient_to_provider":
            lines.append(f"PATIENT ({lang_name}): {m['original']}")
            lines.append(f"  → English: {m['translated']}")
        else:
            lines.append(f"DOCTOR: {m['original']}")
            lines.append(f"  → {lang_name}: {m['translated']}")

    transcript = "\n".join(lines)

    prompt = f"""You are a clinical documentation assistant.

Full transcript of a medical encounter (patient: {lang_name}, provider: English):

{transcript}

Generate a structured clinical summary with these sections:
1. Chief Complaint
2. Reported Symptoms (with duration and severity if mentioned)
3. Relevant History (medications, allergies, prior conditions if mentioned)
4. Key Questions Asked by Provider
5. Urgency Assessment (low/medium/high + reasoning)
6. Recommended Follow-up Actions

Be concise, clinically accurate, and use standard medical documentation style.
Do not invent information not in the transcript."""

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.2, max_output_tokens=2048),
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini summary error: {e}")
        return "Summary generation failed — please review transcript manually."
