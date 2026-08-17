from typing import List, Literal

import requests
from django.conf import settings
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

GEMINI_MODEL = "gemini-2.5-flash"



Somatotype = Literal[
    "ectomorph", "mesomorph", "endomorph",
    "ecto-mesomorph", "meso-endomorph",
]

BodyFatRange = Literal[
    "under 10%", "10-15%", "15-20%", "20-25%",
    "25-30%", "30-35%", "over 35%",
]

MuscleGroup = Literal[
    "pectorals", "lats", "trapezius", "deltoids",
    "biceps", "triceps", "forearms",
    "abs", "obliques", "erector spinae",
    "glutes", "quadriceps", "hamstrings", "calves",
    "adductors", "abductors",
]


class PhysiqueAnalysis(BaseModel):
    """The single 'shape' of a physique assessment, regardless of source."""
    somatotype: Somatotype
    estimated_body_fat_range: BodyFatRange
    lagging_muscles: List[MuscleGroup] = Field(default_factory=list)
    developed_muscles: List[MuscleGroup] = Field(default_factory=list)
    posture_notes: str = ""
    training_focus: str = ""


ANALYSIS_PROMPT = """
You are an expert physique coach and body-composition analyst.
Analyze the attached full-body photo and determine:

1. somatotype - the dominant body type.
2. estimated_body_fat_range - a visual estimate; pick the closest range.
3. lagging_muscles - muscle groups that appear UNDERDEVELOPED relative to the rest.
4. developed_muscles - muscle groups that appear WELL-DEVELOPED.
5. posture_notes - any visible posture issues (e.g. rounded shoulders, anterior
   pelvic tilt). 1-2 sentences.
6. training_focus - one sentence on what training should prioritize.

Rules:
- Be honest but encouraging.
- Only select muscle groups from the allowed list.
- Do NOT identify the person.
"""

def analyze_physique_image(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    gender: str = None,
) -> PhysiqueAnalysis:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = ANALYSIS_PROMPT
    if gender:
        prompt += (
            f"\nNote: the person identifies as {gender}. "
            f"Use this to inform body-fat estimation."
        )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PhysiqueAnalysis,
        ),
    )
    return response.parsed



def analyze_physique_from_url(image_url: str, gender: str = None) -> PhysiqueAnalysis:
    resp = requests.get(image_url, timeout=15)
    resp.raise_for_status()
    mime = resp.headers.get("Content-Type", "image/jpeg").split(";")[0]
    return analyze_physique_image(resp.content, mime_type=mime, gender=gender)


def physique_from_template(template) -> PhysiqueAnalysis:
    """Copy a predefined build's data into the standard analysis shape."""
    return PhysiqueAnalysis(
        somatotype=template.somatotype,
        estimated_body_fat_range=template.estimated_body_fat_range,
        lagging_muscles=list(template.lagging_muscles),
        developed_muscles=list(template.developed_muscles),
        posture_notes=template.posture_notes,
        training_focus=template.training_focus,
    )