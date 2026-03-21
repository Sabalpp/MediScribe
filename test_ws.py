"""
test_ws.py — End-to-end test for MediScribe backend.

Tests: Session creation → WebSocket connection → Gemini translation → ElevenLabs TTS

Usage:
    source .venv/bin/activate
    python test_ws.py
"""

import asyncio
import json
import sys

import httpx
import websockets

API = "http://127.0.0.1:8000"
WS_BASE = "ws://127.0.0.1:8000"

DOCTOR_MESSAGES = [
    "How long have you had this headache?",
    "Are you taking any medications?",
    "Does the pain get worse when you move?",
]


async def run_test():
    print("Creating session...")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{API}/api/sessions/",
            json={"provider_id": "test_doctor", "patient_language": "es"},
        )
        if resp.status_code != 201:
            print(f"FAILED to create session: {resp.status_code} {resp.text}")
            return False
        session = resp.json()
        session_id = session["id"]
        print(f"Session: {session_id}")

    ws_url = f"{WS_BASE}/ws/session/{session_id}/"
    print(f"Connecting to WebSocket...")

    async with websockets.connect(ws_url) as ws:
        msg = await asyncio.wait_for(ws.recv(), timeout=5)
        data = json.loads(msg)
        if data.get("type") != "connection_established":
            print(f"Unexpected first message: {data}")
            return False
        print("Connected!")

        all_passed = True

        for doctor_text in DOCTOR_MESSAGES:
            print(f'\nSending doctor message: "{doctor_text}"')
            await ws.send(json.dumps({
                "type": "provider_text",
                "text": doctor_text,
                "patient_language": "es",
            }))
            print("Waiting for translation...")

            translated = None
            audio_len = 0

            for _ in range(5):
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=20)
                    resp_data = json.loads(msg)

                    if resp_data.get("type") == "provider_message":
                        translated = resp_data.get("translated", "")
                        audio_len = len(resp_data.get("audio_base64", ""))
                        break
                except asyncio.TimeoutError:
                    break

            print("---")
            if translated:
                print(f"  Doctor said:  {doctor_text}")
                print(f"  Translated:   {translated}")
                print(f"  Audio:        {'YES (' + str(audio_len) + ' chars of base64 MP3)' if audio_len else 'NONE'}")

                gemini_ok = "(mock)" not in translated and "unavailable" not in translated.lower()
                eleven_ok = audio_len > 0

                if gemini_ok and eleven_ok:
                    print("  Status:       PASSED")
                else:
                    if not gemini_ok:
                        print("  Status:       FAILED — Gemini returned mock/fallback")
                    if not eleven_ok:
                        print("  Status:       FAILED — No audio from ElevenLabs")
                    all_passed = False
            else:
                print("  Status:       FAILED — No response received")
                all_passed = False
            print("---")

    print()
    if all_passed:
        print("Test PASSED — Gemini + ElevenLabs both working!")
    else:
        print("Test had FAILURES — check output above.")
    return all_passed


if __name__ == "__main__":
    try:
        result = asyncio.run(run_test())
        sys.exit(0 if result else 1)
    except ConnectionRefusedError:
        print("ERROR: Cannot connect to backend. Is the server running on port 8000?")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
