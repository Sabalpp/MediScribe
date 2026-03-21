from rest_framework import serializers
from .models import Session, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "id",
            "direction",
            "original_text",
            "translated_text",
            "medical_flags",
            "rag_validated",
            "timestamp",
        ]
        read_only_fields = fields


class SessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "provider_id",
            "patient_language",
            "created_at",
            "ended_at",
            "medical_summary",
            "messages",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "ended_at",
            "medical_summary",
            "messages",
        ]


class SessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ["provider_id", "patient_language"]
