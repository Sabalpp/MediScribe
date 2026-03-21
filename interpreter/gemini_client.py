"""
gemini_client.py

Two-mode Gemini pipeline matching the team architecture:

Mode 1 — Doctor→Patient (Simplification & Tone):
  English medical jargon → simplified 5th-grade English → translated to patient language

Mode 2 — Patient→Doctor (Grammar Recovery & Structuring):
  Raw patient speech (any language) → translated to English → grammar-fixed professional English

Gemini is the Orchestrator. 11 Labs handles STT/TTS only.
"""

import os
import json
import asyncio
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

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
    "ne": "Nepali",
}

MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SYSTEM_PROMPT = """Role: You are a specialized Medical Translation and Logic Engine. Your goal is to facilitate clear, professional communication between a Doctor (English speaker) and a Patient (Non-English speaker or broken english).

Operational Modes:

1. Mode: Doctor-to-Patient (Simplification & Tone)
Input: Technical medical jargon or clinical instructions in English.
Action: Simplify the language to a 5th-grade reading level. Remove complex medical terminology while retaining the exact meaning of the diagnosis or instruction.
Output: A concise, empathetic English string ready for translation.

2. Mode: Patient-to-Doctor (Grammar Recovery & Structuring)
Input: Raw, potentially "funky" or grammatically broken English (translated from the patient's language).
Action: Restructure the sentence for medical clarity. Fix syntax errors and clarify intent (e.g., changing "my head do big hurt" to "the patient is experiencing a severe migraine").
Output: A professional, structured English string for the doctor's records.

Constraints:
- No Hallucinations: Do not add medical advice not present in the input.
- Brevity: Keep outputs under 3 sentences to minimize processing time.
- Transparency: If an input is too garbled to fix, output: "[CLARIFICATION NEEDED]"."""


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
# Mode 1: Doctor → Patient (Simplify + Translate)
# ---------------------------------------------------------------------------

async def process_doctor_to_patient(english_text: str, patient_language: str) -> dict:
    """
    Doctor spoke English. Pipeline:
    1. Gemini simplifies medical jargon to 5th-grade level
    2. Gemini translates simplified English → patient's language
    3. Returns both for display + TTS

    Returns:
    {
        "original": "You have acute pleuritic chest pain consistent with pericarditis",
        "simplified": "You have a sharp pain in your chest when you breathe. This is because the lining around your heart is swollen.",
        "translated": "<same in patient's language>",
        "follow_up_suggestions": ["Ask: What medicine will help?", "Ask: Is this serious?"]
    }
    """
    lang_name = LANG_NAMES.get(patient_language, patient_language)
    client = get_client()

    prompt = f"""MODE: Doctor-to-Patient

The doctor said (in English):
"{english_text}"

The patient speaks {lang_name}.

Tasks:
1. Simplify the doctor's words to a 5th-grade reading level. Remove jargon but keep exact medical meaning.
2. Translate the simplified version into {lang_name} using warm, reassuring tone.
3. Suggest 1-2 follow-up questions the patient could ask for clarification.

Respond ONLY with valid JSON:
{{
  "original": "{english_text}",
  "simplified": "<simplified English, max 3 sentences>",
  "translated": "<translation in {lang_name}, max 3 sentences>",
  "follow_up_suggestions": ["<question patient could ask>", "<question patient could ask>"]
}}"""

    fallback = {
        "original": english_text,
        "simplified": english_text,
        "translated": f"(mock translation) {english_text}",
        "follow_up_suggestions": ["Can you explain that in simpler words?"],
    }

    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — returning mock")
        return fallback

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )
        return _parse_json_response(response.text, fallback)
    except Exception as e:
        logger.error(f"Gemini doctor→patient error: {e}")
        return fallback


# ---------------------------------------------------------------------------
# Mode 2: Patient → Doctor (Translate + Grammar Fix)
# ---------------------------------------------------------------------------

async def process_patient_to_doctor(patient_text: str, patient_language: str) -> dict:
    """
    Patient spoke in their language (transcribed by 11 Labs STT).
    Pipeline:
    1. Gemini translates raw patient text → English
    2. Gemini applies Grammar Recovery: fixes broken/funky translation into
       professional medical English for the doctor
    3. Extracts medical flags

    Returns:
    {
        "original": "मेरी छाती में बहुत दर्द है जब मैं सांस लेता हूं",
        "raw_english": "my chest do big hurt when i breathing",
        "fixed_english": "The patient is experiencing significant chest pain on inspiration.",
        "medical_flags": {
            "symptoms": ["chest pain on breathing"],
            "urgency": "high",
            "suggested_questions": ["How long has this been happening?"]
        }
    }
    """
    lang_name = LANG_NAMES.get(patient_language, patient_language)
    client = get_client()

    prompt = f"""MODE: Patient-to-Doctor

The patient spoke in {lang_name}. Their transcribed speech is:
"{patient_text}"

Tasks:
1. Translate the patient's words into English (this may produce imperfect English — that's expected).
2. Apply Grammar Recovery: restructure into clear, professional medical English for the doctor's records. Fix syntax, clarify intent.
3. Extract medical flags from the content.
4. If the input is too garbled to understand, set fixed_english to "[CLARIFICATION NEEDED]".

Respond ONLY with valid JSON:
{{
  "original": "<cleaned original in {lang_name}>",
  "raw_english": "<direct English translation, may be imperfect>",
  "fixed_english": "<professional, restructured English, max 3 sentences>",
  "medical_flags": {{
    "symptoms": ["<symptoms mentioned>"],
    "urgency": "<low|medium|high>",
    "suggested_questions": ["<1-2 follow-up questions for the doctor>"]
  }}
}}"""

    fallback = {
        "original": patient_text,
        "raw_english": f"(direct) {patient_text}",
        "fixed_english": f"(mock) {patient_text}",
        "medical_flags": {
            "symptoms": [],
            "urgency": "medium",
            "suggested_questions": ["Can you describe the pain?", "When did it start?"],
        },
    }

    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set — returning mock")
        return fallback

    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )
        return _parse_json_response(response.text, fallback)
    except Exception as e:
        logger.error(f"Gemini patient→doctor error: {e}")
        return fallback


# ---------------------------------------------------------------------------
# Session summary — called when session ends
# ---------------------------------------------------------------------------

async def generate_session_summary(messages: list[dict], patient_language: str) -> str:
    """
    Full transcript → structured clinical summary.
    """
    if not messages:
        return "No messages recorded in this session."

    lang_name = LANG_NAMES.get(patient_language, "the patient's language")
    client = get_client()

    lines = []
    for m in messages:
        if m["direction"] == "patient_to_provider":
            lines.append(f"PATIENT ({lang_name}): {m.get('original', '')}")
            lines.append(f"  → Doctor sees: {m.get('fixed_english', m.get('translated', ''))}")
        else:
            lines.append(f"DOCTOR: {m.get('original', '')}")
            lines.append(f"  → Patient hears ({lang_name}): {m.get('translated', '')}")

    transcript = "\n".join(lines)

    prompt = f"""You are a clinical documentation assistant.

Full transcript of a medical encounter (patient: {lang_name}, provider: English):

{transcript}

Generate a structured clinical summary:
1. Chief Complaint
2. Reported Symptoms (with duration and severity if mentioned)
3. Relevant History (medications, allergies, prior conditions if mentioned)
4. Key Questions Asked by Provider
5. Urgency Assessment (low/medium/high + reasoning)
6. Recommended Follow-up Actions

Be concise, clinically accurate. Do not invent information not in the transcript."""

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
