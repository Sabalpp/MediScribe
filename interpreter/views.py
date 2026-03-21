"""
views.py — REST API endpoints

POST   /api/sessions/                  Create a new session
GET    /api/sessions/                  List sessions for a provider
GET    /api/sessions/<id>/             Get session detail + full transcript
POST   /api/sessions/<id>/end/         End session, trigger Gemini summary
GET    /api/sessions/<id>/summary/     Get the AI-generated medical summary
DELETE /api/sessions/<id>/             Delete session (admin only)
GET    /api/health/                    Health check
"""

import asyncio
import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Session, Message
from .serializers import SessionSerializer, SessionCreateSerializer, MessageSerializer
from .gemini_client import generate_session_summary

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "service": "VoiceBridge API"})


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
def sessions_list(request):
    """
    GET  — list sessions for a provider (pass ?provider_id=xxx)
    POST — create a new session
    """
    if request.method == "GET":
        provider_id = request.query_params.get("provider_id", "")
        if not provider_id:
            return Response(
                {"error": "provider_id query param required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sessions = Session.objects.filter(provider_id=provider_id)
        serializer = SessionSerializer(sessions, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = SessionCreateSerializer(data=request.data)
        if serializer.is_valid():
            session = serializer.save()
            return Response(
                SessionSerializer(session).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "DELETE"])
def session_detail(request, session_id):
    """GET — full session detail with transcript. DELETE — remove session."""
    try:
        session = Session.objects.prefetch_related("messages").get(id=session_id)
    except Session.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(SessionSerializer(session).data)

    elif request.method == "DELETE":
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def end_session(request, session_id):
    """
    Marks session as ended and triggers Gemini to generate a medical summary.
    The summary is saved to session.medical_summary.
    """
    try:
        session = Session.objects.prefetch_related("messages").get(id=session_id)
    except Session.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

    if session.ended_at:
        return Response({"error": "Session already ended"}, status=status.HTTP_400_BAD_REQUEST)

    session.ended_at = timezone.now()

    # Build transcript for Gemini
    messages_data = [
        {
            "direction": m.direction,
            "original": m.original_text,
            "translated": m.translated_text,
        }
        for m in session.messages.all()
    ]

    # Generate summary synchronously (wrap async in sync context)
    if messages_data:
        try:
            summary = asyncio.run(
                generate_session_summary(messages_data, session.patient_language)
            )
            session.medical_summary = summary
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            session.medical_summary = "Summary could not be generated automatically."

    session.save()
    return Response(SessionSerializer(session).data)


@api_view(["GET"])
def session_summary(request, session_id):
    """Return just the AI-generated medical summary for a session."""
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

    if not session.medical_summary:
        return Response(
            {"error": "No summary available. End the session first."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "session_id": str(session.id),
        "summary": session.medical_summary,
        "generated_at": session.ended_at,
        "patient_language": session.patient_language,
    })


@api_view(["GET"])
def session_messages(request, session_id):
    """Return paginated messages for a session."""
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

    messages = session.messages.all()
    serializer = MessageSerializer(messages, many=True)
    return Response({
        "session_id": str(session.id),
        "count": messages.count(),
        "messages": serializer.data,
    })
