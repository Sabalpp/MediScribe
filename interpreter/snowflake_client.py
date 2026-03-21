"""
snowflake_client.py

Snowflake Cortex RAG integration for medical data validation.

What this does:
- validate_medical_terms: checks extracted symptoms/terms against Snowflake's
  medical datasets to verify they're clinically meaningful
- get_medical_context: pulls relevant context from Snowflake's medical data
  to give Gemini more grounding when summarizing

NOTE for hackathon: If Snowflake isn't set up yet, every function gracefully
returns a "not validated" result so the rest of the pipeline keeps working.
Just set the env vars and it auto-activates.
"""

import os
import json
import asyncio
import logging
import snowflake.connector

logger = logging.getLogger(__name__)

SNOWFLAKE_CONFIG = {
    "account": os.getenv("SNOWFLAKE_ACCOUNT", ""),
    "user": os.getenv("SNOWFLAKE_USER", ""),
    "password": os.getenv("SNOWFLAKE_PASSWORD", ""),
    "database": os.getenv("SNOWFLAKE_DATABASE", ""),
    "schema": os.getenv("SNOWFLAKE_SCHEMA", ""),
    "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE", ""),
}

_snowflake_available = all(SNOWFLAKE_CONFIG.values())


def _get_connection():
    """Create a Snowflake connection. Returns None if config is missing."""
    if not _snowflake_available:
        return None
    try:
        return snowflake.connector.connect(**SNOWFLAKE_CONFIG)
    except Exception as e:
        logger.error(f"Snowflake connection failed: {e}")
        return None


async def validate_medical_terms(symptoms: list[str], body_parts: list[str]) -> dict:
    """
    Run extracted symptoms + body parts through Snowflake's medical dataset
    to validate and enrich them.

    Returns:
        {
            "validated": True/False,
            "enriched_symptoms": [...],    # standardized ICD-friendly terms
            "drug_interactions": [...],    # if medications were flagged
            "icd_suggestions": [...],      # possible ICD-10 codes
            "source": "snowflake" | "skipped"
        }
    """
    if not _snowflake_available:
        logger.info("Snowflake not configured — skipping RAG validation")
        return {
            "validated": False,
            "enriched_symptoms": symptoms,
            "drug_interactions": [],
            "icd_suggestions": [],
            "source": "skipped",
        }

    def _run_query():
        conn = _get_connection()
        if not conn:
            return None
        try:
            cursor = conn.cursor()
            # Use Snowflake Cortex SEARCH for semantic medical term lookup
            # Adjust table/column names to match your Snowflake schema
            symptoms_str = ", ".join(f"'{s}'" for s in symptoms[:5])  # cap at 5
            query = f"""
                SELECT
                    symptom_standardized,
                    icd10_code,
                    icd10_description,
                    severity_weight
                FROM medical_symptoms_reference
                WHERE LOWER(symptom_raw) IN ({symptoms_str.lower()})
                   OR CONTAINS(LOWER(symptom_raw), LOWER(ARRAY_TO_STRING(ARRAY_CONSTRUCT({symptoms_str}), ' ')))
                LIMIT 10;
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            return rows
        except Exception as e:
            logger.error(f"Snowflake query error: {e}")
            return None
        finally:
            conn.close()

    try:
        rows = await asyncio.to_thread(_run_query)
        if not rows:
            return {
                "validated": False,
                "enriched_symptoms": symptoms,
                "drug_interactions": [],
                "icd_suggestions": [],
                "source": "snowflake_empty",
            }

        icd_suggestions = [
            {"code": row[1], "description": row[2]}
            for row in rows
            if row[1]
        ]
        enriched = [row[0] for row in rows if row[0]]

        return {
            "validated": True,
            "enriched_symptoms": enriched or symptoms,
            "drug_interactions": [],
            "icd_suggestions": icd_suggestions,
            "source": "snowflake",
        }

    except Exception as e:
        logger.error(f"Snowflake validation error: {e}")
        return {
            "validated": False,
            "enriched_symptoms": symptoms,
            "drug_interactions": [],
            "icd_suggestions": [],
            "source": "error",
        }


async def get_medical_context(symptoms: list[str]) -> str:
    """
    Use Snowflake Cortex to pull relevant medical knowledge context
    for a given list of symptoms. This context can be passed to Gemini
    to improve summary quality.

    Returns a plain-text context string (empty string if Snowflake unavailable).
    """
    if not _snowflake_available or not symptoms:
        return ""

    def _run_cortex_query():
        conn = _get_connection()
        if not conn:
            return ""
        try:
            cursor = conn.cursor()
            symptom_query = " ".join(symptoms[:3])
            # Snowflake Cortex COMPLETE for RAG-powered medical context
            query = f"""
                SELECT SNOWFLAKE.CORTEX.COMPLETE(
                    'mixtral-8x7b',
                    CONCAT(
                        'You are a medical knowledge assistant. ',
                        'Provide a brief clinical context (2-3 sentences) for a patient presenting with: ',
                        '{symptom_query}',
                        '. Focus on what the doctor should look for and urgency indicators.'
                    )
                ) AS medical_context;
            """
            cursor.execute(query)
            row = cursor.fetchone()
            return row[0] if row else ""
        except Exception as e:
            logger.error(f"Snowflake Cortex error: {e}")
            return ""
        finally:
            conn.close()

    try:
        return await asyncio.to_thread(_run_cortex_query)
    except Exception as e:
        logger.error(f"Snowflake context error: {e}")
        return ""
