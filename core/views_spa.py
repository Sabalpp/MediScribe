"""
SPA catch-all view.

Serves dist/index.html for all routes not matched by /api/ or /admin/.
This lets React Router handle client-side routing in production.
"""

from pathlib import Path
from django.http import FileResponse, HttpResponseNotFound

_INDEX = Path(__file__).resolve().parent.parent / "dist" / "index.html"


def spa_index(request):
    if _INDEX.exists():
        return FileResponse(open(_INDEX, "rb"), content_type="text/html")
    return HttpResponseNotFound(
        "Frontend not built. Run: npm run build",
        content_type="text/plain",
    )
