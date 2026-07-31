import json
from google import genai
from django.conf import settings

SAFETY_PROMPT_TEMPLATE = """You are a safety filter for a fitness app. A user has provided the following information during onboarding. Your job is ONLY to identify body parts or movement types that should be AVOIDED when building their workout plan — you are not diagnosing or giving medical advice.

Injury details: {injury_details}
Medication details: {medication_details}
Doctor restriction details: {doctor_restriction_details}

Based ONLY on the information above, respond with a JSON object in this exact format, and nothing else — no markdown, no explanation:
{{"exclusions": ["keyword1", "keyword2"]}}

Each keyword should be a simple, lowercase word or short phrase describing a body part or movement type to avoid (e.g., "knees", "shoulders", "overhead pressing", "spinal loading", "high-impact"). If there is nothing concerning in the text above, respond with {{"exclusions": []}}. Do not include anything else in your response."""


def get_safety_exclusions(profile):
    injury = profile.injury_details or "None provided"
    medication = profile.medication_details or "None provided"
    restriction = profile.doctor_restriction_details or "None provided"

    if injury == "None provided" and medication == "None provided" and restriction == "None provided":
        return []

    prompt = SAFETY_PROMPT_TEMPLATE.format(
        injury_details=injury,
        medication_details=medication,
        doctor_restriction_details=restriction,
    )

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()

        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        parsed = json.loads(text)
        return parsed.get("exclusions", [])

    except Exception as e:
        print(f"Safety exclusion parsing failed: {e}")
        return []