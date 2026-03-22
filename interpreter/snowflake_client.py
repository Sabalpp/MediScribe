"""
snowflake_client.py

Snowflake integration for MediScribe:
- sync_session: push completed session + messages to Snowflake warehouse
- get_analytics: query aggregate stats (symptoms, languages, urgency)

All functions are sync (called via async_to_sync in views).
Gracefully no-ops if Snowflake is not configured.
"""

import os
import json
import logging
import snowflake.connector

logger = logging.getLogger(__name__)


def _get_conn():
    """Create a Snowflake connection. Returns None if config missing."""
    account = os.getenv("SNOWFLAKE_ACCOUNT", "")
    user = os.getenv("SNOWFLAKE_USER", "")
    password = os.getenv("SNOWFLAKE_PASSWORD", "")
    if not all([account, user, password]):
        return None
    try:
        return snowflake.connector.connect(
            account=account,
            user=user,
            password=password,
            database=os.getenv("SNOWFLAKE_DATABASE", "MEDISCRIBE"),
            schema=os.getenv("SNOWFLAKE_SCHEMA", "PUBLIC"),
            warehouse=os.getenv("SNOWFLAKE_WAREHOUSE", "COMPUTE_WH"),
        )
    except Exception as e:
        logger.error(f"Snowflake connection failed: {e}")
        return None


def sync_session(session):
    """Push a completed session and its messages to Snowflake."""
    conn = _get_conn()
    if not conn:
        logger.info("Snowflake not configured — skipping sync")
        return False
    try:
        cur = conn.cursor()

        # Upsert session
        cur.execute("""
            MERGE INTO SESSIONS t USING (SELECT %s AS ID) s ON t.ID = s.ID
            WHEN MATCHED THEN UPDATE SET
                ENDED_AT = %s, MEDICAL_SUMMARY = %s, SYNCED_AT = CURRENT_TIMESTAMP()
            WHEN NOT MATCHED THEN INSERT (ID, PROVIDER_ID, PATIENT_LANGUAGE, CREATED_AT, ENDED_AT, MEDICAL_SUMMARY)
                VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            str(session.id),
            session.ended_at, session.medical_summary or "",
            str(session.id), session.provider_id, session.patient_language,
            session.created_at, session.ended_at, session.medical_summary or "",
        ))

        # Insert messages (deduplicated)
        for msg in session.messages.all():
            flags_json = json.dumps(msg.medical_flags or {})
            cur.execute("""
                INSERT INTO MESSAGES (SESSION_ID, DIRECTION, ORIGINAL_TEXT, TRANSLATED_TEXT, MEDICAL_FLAGS, CREATED_AT)
                SELECT %s, %s, %s, %s, PARSE_JSON(%s), %s
                WHERE NOT EXISTS (
                    SELECT 1 FROM MESSAGES
                    WHERE SESSION_ID = %s AND DIRECTION = %s
                      AND CREATED_AT = %s AND ORIGINAL_TEXT = %s
                )
            """, (
                str(session.id), msg.direction, msg.original_text,
                msg.translated_text, flags_json, msg.timestamp,
                str(session.id), msg.direction, msg.timestamp, msg.original_text,
            ))

        conn.commit()
        logger.info(f"Synced session {session.id} to Snowflake")
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Snowflake sync error: {e}")
        try:
            conn.close()
        except Exception:
            pass
        return False


def get_analytics():
    """Query aggregate analytics from Snowflake."""
    conn = _get_conn()
    if not conn:
        return {"error": "Snowflake not configured"}
    try:
        cur = conn.cursor()
        stats = {}

        cur.execute("SELECT COUNT(*), COUNT(CASE WHEN ENDED_AT IS NOT NULL THEN 1 END) FROM SESSIONS")
        row = cur.fetchone()
        stats["total_sessions"] = row[0]
        stats["completed_sessions"] = row[1]

        cur.execute("SELECT COUNT(*) FROM MESSAGES")
        stats["total_messages"] = cur.fetchone()[0]

        # Messages by direction
        cur.execute("SELECT DIRECTION, COUNT(*) FROM MESSAGES GROUP BY DIRECTION")
        stats["messages_by_direction"] = {r[0]: r[1] for r in cur.fetchall()}

        # Language distribution
        cur.execute("SELECT PATIENT_LANGUAGE, COUNT(*) FROM SESSIONS GROUP BY PATIENT_LANGUAGE ORDER BY 2 DESC")
        stats["languages"] = {r[0]: r[1] for r in cur.fetchall()}

        # Top symptoms from medical_flags JSON
        cur.execute("""
            SELECT f.value::STRING AS symptom, COUNT(*) AS cnt
            FROM MESSAGES,
                 LATERAL FLATTEN(input => MEDICAL_FLAGS:symptoms, outer => true) f
            WHERE f.value IS NOT NULL
            GROUP BY symptom ORDER BY cnt DESC
            LIMIT 10
        """)
        stats["top_symptoms"] = {r[0]: r[1] for r in cur.fetchall()}

        # Urgency distribution
        cur.execute("""
            SELECT MEDICAL_FLAGS:urgency::STRING AS urgency, COUNT(*) AS cnt
            FROM MESSAGES
            WHERE MEDICAL_FLAGS:urgency IS NOT NULL
            GROUP BY urgency ORDER BY cnt DESC
        """)
        stats["urgency_distribution"] = {r[0]: r[1] for r in cur.fetchall()}

        # Avg messages per session
        cur.execute("""
            SELECT COALESCE(AVG(c), 0) FROM (
                SELECT SESSION_ID, COUNT(*) AS c FROM MESSAGES GROUP BY SESSION_ID
            )
        """)
        stats["avg_messages_per_session"] = round(float(cur.fetchone()[0]), 1)

        conn.close()
        return stats
    except Exception as e:
        logger.error(f"Snowflake analytics error: {e}")
        try:
            conn.close()
        except Exception:
            pass
        return {"error": str(e)}
