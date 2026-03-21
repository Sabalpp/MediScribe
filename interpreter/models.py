import uuid
from django.db import models


class Session(models.Model):
    """
    One session = one patient-doctor conversation.
    Created by the frontend when the doctor starts a new encounter.
    """
    LANGUAGE_CHOICES = [
        ("es", "Spanish"),
        ("zh", "Mandarin Chinese"),
        ("vi", "Vietnamese"),
        ("fr", "French"),
        ("pt", "Portuguese"),
        ("ar", "Arabic"),
        ("hi", "Hindi"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Auth0 sub — identifies the provider/doctor
    provider_id = models.CharField(max_length=256, db_index=True)
    patient_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="es")
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    # Gemini-generated summary written at session end
    medical_summary = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Session {self.id} [{self.patient_language}] — {self.provider_id}"

    @property
    def is_active(self):
        return self.ended_at is None


class Message(models.Model):
    DIRECTION_PATIENT_TO_PROVIDER = "patient_to_provider"
    DIRECTION_PROVIDER_TO_PATIENT = "provider_to_patient"
    DIRECTION_CHOICES = [
        (DIRECTION_PATIENT_TO_PROVIDER, "Patient → Provider"),
        (DIRECTION_PROVIDER_TO_PATIENT, "Provider → Patient"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="messages")
    direction = models.CharField(max_length=32, choices=DIRECTION_CHOICES)
    original_text = models.TextField()
    translated_text = models.TextField()
    medical_flags = models.JSONField(default=dict, blank=True)
    rag_validated = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"[{self.direction}] {self.original_text[:60]}"
