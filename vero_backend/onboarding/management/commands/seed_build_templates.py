from django.core.management.base import BaseCommand
from onboarding.models import BuildTemplate

BUILD_TYPES = [
    # ─── 1. Low-Muscle Spectrum ───
    {"name": "Slim / Linear (Ectomorph)",
     "description": "Naturally thin, light frame. Low fat, low muscle.",
     "somatotype": "ectomorph", "estimated_body_fat_range": "10-15%",
     "lagging_muscles": ["pectorals", "delts", "lats", "biceps", "triceps", "quads", "glutes"],
     "developed_muscles": ["abs"],
     "posture_notes": "",
     "training_focus": "Compound lifts and calorie surplus for overall mass."},
    {"name": "Skinny-Fat / Metabolic-Obese",
     "description": "Thin limbs, belly/waist fat. Low muscle.",
     "somatotype": "ecto-mesomorph", "estimated_body_fat_range": "20-25%",
     "lagging_muscles": ["pectorals", "delts", "lats", "triceps"],
     "developed_muscles": [],
     "posture_notes": "Possible anterior pelvic tilt.",
     "training_focus": "Recomposition: build upper body while losing central fat."},
    {"name": "Average / Normal",
     "description": "Moderate fat, moderate-to-low muscle. Neutral physique.",
     "somatotype": "mesomorph", "estimated_body_fat_range": "15-20%",
     "lagging_muscles": ["pectorals", "lats", "delts", "quads", "glutes"],
     "developed_muscles": [],
     "posture_notes": "",
     "training_focus": "Full-body strength foundation with progressive overload."},
    # ─── 2. Muscular & Defined Spectrum ───
    {"name": "Lean / Toned",
     "description": "Low fat, visible baseline muscle. Firm but slender.",
     "somatotype": "ecto-mesomorph", "estimated_body_fat_range": "10-15%",
     "lagging_muscles": ["biceps", "triceps", "calves"],
     "developed_muscles": ["pectorals", "delts", "quads"],
     "posture_notes": "",
     "training_focus": "Targeted hypertrophy for arms to complete the look."},
    {"name": "Fit / Athletic",
     "description": "Noticeable muscle, low fat, athletic proportions.",
     "somatotype": "mesomorph", "estimated_body_fat_range": "10-15%",
     "lagging_muscles": ["hamstrings", "calves", "forearms"],
     "developed_muscles": ["pectorals", "delts", "quads", "lats"],
     "posture_notes": "",
     "training_focus": "Refine weak points; increase intensity."},
    {"name": "Ripped / Shredded",
     "description": "High muscle, very low fat. Vascular and defined.",
     "somatotype": "mesomorph", "estimated_body_fat_range": "under 10%",
     "lagging_muscles": [],
     "developed_muscles": ["pectorals", "lats", "delts", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves"],
     "posture_notes": "",
     "training_focus": "Maintenance and symmetry; avoid overtraining."},
    # ─── 3. Heavy-Set & Power Spectrum ───
    {"name": "Stocky / Solid",
     "description": "Wide frame, moderate-high muscle + protective fat.",
     "somatotype": "endo-mesomorph", "estimated_body_fat_range": "20-25%",
     "lagging_muscles": ["abs", "calves"],
     "developed_muscles": ["quads", "glutes", "pectorals"],
     "posture_notes": "",
     "training_focus": "Maintain muscle while cutting; add conditioning."},
    {"name": "Bear / Powerlifter",
     "description": "Huge muscle under high fat. Massive, powerful.",
     "somatotype": "endomorph", "estimated_body_fat_range": "25-30%",
     "lagging_muscles": ["abs", "calves"],
     "developed_muscles": ["pectorals", "lats", "traps", "delts", "quads", "hamstrings", "glutes"],
     "posture_notes": "Possible rounded shoulders.",
     "training_focus": "Fat loss while preserving strength; mobility."},
    # ─── 4. Soft & High-Fat Spectrum ───
    {"name": "Chubby / Soft",
     "description": "Evenly distributed fat; muscle hidden.",
     "somatotype": "endomorph", "estimated_body_fat_range": "25-30%",
     "lagging_muscles": ["pectorals", "delts", "lats", "quads", "glutes"],
     "developed_muscles": [],
     "posture_notes": "",
     "training_focus": "Strength + calorie deficit to reveal muscle."},
    {"name": "Apple / Visceral-Dominant",
     "description": "Fat concentrated in abdomen; thinner limbs.",
     "somatotype": "endomorph", "estimated_body_fat_range": "25-30%",
     "lagging_muscles": ["delts", "pectorals", "lats"],
     "developed_muscles": ["quads", "glutes"],
     "posture_notes": "Possible forward-head posture.",
     "training_focus": "Build upper-body width; add cardio."},
    {"name": "Pear / Subcutaneous-Dominant",
     "description": "Fat concentrated in hips/thighs; leaner upper body.",
     "somatotype": "endomorph", "estimated_body_fat_range": "25-30%",
     "lagging_muscles": ["delts", "pectorals", "lats", "biceps"],
     "developed_muscles": ["quads", "glutes"],
     "posture_notes": "",
     "training_focus": "Build upper-body width to balance lower body."},
    {"name": "Heavy / Obese",
     "description": "High fat stored evenly and deeply across the frame.",
     "somatotype": "endomorph", "estimated_body_fat_range": "over 35%",
     "lagging_muscles": ["pectorals", "lats", "delts", "biceps", "triceps", "abs"],
     "developed_muscles": ["quads", "glutes"],
     "posture_notes": "Prioritize low-impact conditioning.",
     "training_focus": "Sustainable fat loss; low-impact cardio + strength."},
]
class Command(BaseCommand):
    help = "Seed the 12 predefined build templates (body types)."

    def handle(self, *args, **options):
        for bt in BUILD_TYPES:
            _, created = BuildTemplate.objects.update_or_create(
                name=bt["name"], defaults=bt
            )
            action = "created" if created else "updated"
            self.stdout.write(f"{action}: {bt['name']}")
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(BUILD_TYPES)} build templates."))