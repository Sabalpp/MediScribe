from django.contrib import admin
from .models import Session, Message


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("id", "provider_id", "patient_language", "created_at", "ended_at")
    list_filter = ("patient_language", "ended_at")
    search_fields = ("provider_id",)
    readonly_fields = ("id", "created_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "direction", "timestamp", "rag_validated")
    list_filter = ("direction", "rag_validated")
    readonly_fields = ("id", "timestamp")
