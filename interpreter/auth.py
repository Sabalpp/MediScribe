"""
auth.py

Lightweight Auth0 JWT validation middleware.
Verifies the Authorization: Bearer <token> header on protected endpoints.

Usage in views:
    from .auth import require_auth

    @api_view(["GET"])
    @require_auth
    def my_view(request):
        provider_id = request.auth0_sub  # Auth0 user ID injected by middleware
        ...

For hackathon speed: set SKIP_AUTH=True in .env to bypass token checks
during local development. NEVER do this in production.
"""

import os
import json
import logging
import functools
import urllib.request

from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "")
SKIP_AUTH = os.getenv("SKIP_AUTH", "True") == "True"  # Default True for hackathon dev speed

_jwks_cache = None


def _get_jwks():
    """Fetch Auth0 JWKS (public keys) — cached in memory."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    if not AUTH0_DOMAIN:
        return {}
    try:
        url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        with urllib.request.urlopen(url, timeout=5) as r:
            _jwks_cache = json.loads(r.read())
        return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS: {e}")
        return {}


def _decode_token(token: str) -> dict | None:
    """
    Decode and validate an Auth0 JWT.
    Returns the payload dict if valid, None if invalid.
    """
    try:
        import base64

        # Split JWT
        parts = token.split(".")
        if len(parts) != 3:
            return None

        # Decode payload (base64url)
        payload_b64 = parts[1]
        # Add padding
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload

    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None


def require_auth(view_func):
    """
    Decorator that validates Auth0 JWT on a DRF view.
    Injects request.auth0_sub with the provider's Auth0 user ID.

    In SKIP_AUTH mode (default for local dev), accepts any token
    and sets auth0_sub to "dev_provider".
    """
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if SKIP_AUTH:
            request.auth0_sub = request.headers.get("X-Provider-Id", "dev_provider")
            return view_func(request, *args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return Response(
                {"error": "Missing or invalid Authorization header"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token = auth_header[7:]
        payload = _decode_token(token)

        if not payload:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check expiry
        import time
        if payload.get("exp", 0) < time.time():
            return Response(
                {"error": "Token expired"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Check audience
        if AUTH0_AUDIENCE and payload.get("aud") != AUTH0_AUDIENCE:
            return Response(
                {"error": "Invalid audience"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        request.auth0_sub = payload.get("sub", "")
        return view_func(request, *args, **kwargs)

    return wrapper
