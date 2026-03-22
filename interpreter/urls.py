from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    path("sessions/", views.sessions_list, name="sessions-list"),
    path("sessions/<uuid:session_id>/", views.session_detail, name="session-detail"),
    path("sessions/<uuid:session_id>/end/", views.end_session, name="session-end"),
    path("sessions/<uuid:session_id>/summary/", views.session_summary, name="session-summary"),
    path("sessions/<uuid:session_id>/messages/", views.session_messages, name="session-messages"),
    path("analytics/", views.analytics, name="analytics"),
]
