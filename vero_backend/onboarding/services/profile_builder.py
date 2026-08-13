from django.conf import settings

from onboarding.models import PhysiqueProfile
from .biometrics import calculate_biometrics

def build_profile_from_template(user, template) -> PhysiqueProfile:
    profile = user.onboarding_profile
    bio = calculate_biometrics(profile)
    
    return PhysiqueProfile.objects.create(
        user=user,
        build_template=template,
        source=PhysiqueProfile.Source.BUILD_TEMPLATE,
        status=PhysiqueProfile.Status.COMPLETED,
        # ── From the selected template ──
        somatotype=template.somatotype,
        estimated_body_fat_range=template.estimated_body_fat_range,
        lagging_muscles=list(template.lagging_muscles),
        developed_muscles=list(template.developed_muscles),
        posture_notes=template.posture_notes,
        training_focus=template.training_focus,
        # ── Biometric snapshot at time of analysis ──
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        # ── Calculated metrics ──
        bmi=bio.bmi,
        bmr=bio.bmr,
        tdee=bio.tdee,
        target_calories=bio.target_calories,
        target_protein_g=bio.target_protein_g,
        target_carbs_g=bio.target_carbs_g,
        target_fats_g=bio.target_fats_g,
    )
    
def build_profile_from_image(user, image_bytes, gender=None, mime_type="image/jpeg"):
    if not getattr(settings, "ENABLE_AI_IMAGE_ANALYSIS", False):
        raise RuntimeError("AI image analysis is disabled (future feature).")

    # Lazy import so mediapipe / genai are never loaded while the flag is off.
    from .hybrid_analysis import analyze_physique_hybrid

    profile = user.onboarding_profile
    bio = calculate_biometrics(profile)
    analysis = analyze_physique_hybrid(image_bytes, gender=gender, mime_type=mime_type)

    return PhysiqueProfile.objects.create(
        user=user,
        source=PhysiqueProfile.Source.PHOTO,
        status=PhysiqueProfile.Status.COMPLETED,
        # ── From the hybrid analysis ──
        somatotype=analysis.somatotype,
        estimated_body_fat_range=analysis.estimated_body_fat_range,
        lagging_muscles=analysis.lagging_muscles,
        developed_muscles=analysis.developed_muscles,
        posture_notes=analysis.posture_notes,
        training_focus=analysis.training_focus,
        # ── Biometric snapshot ──
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        # ── Calculated metrics ──
        bmi=bio.bmi,
        bmr=bio.bmr,
        tdee=bio.tdee,
        target_calories=bio.target_calories,
        target_protein_g=bio.target_protein_g,
        target_carbs_g=bio.target_carbs_g,
        target_fats_g=bio.target_fats_g,
        # ── Geometric (research comparison) fields ──
        shoulder_to_hip_ratio=analysis.shoulder_to_hip_ratio,
        shoulder_tilt=analysis.shoulder_tilt,
        symmetry_score=analysis.symmetry_score,
        geometric_somatotype_estimate=analysis.geometric_somatotype_estimate,
    )