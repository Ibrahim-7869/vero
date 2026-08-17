from django.core.management.base import BaseCommand
from health.models import InjuryTypeTemplate

TEMPLATES = [
    # body_part, mild, moderate, severe, avoid tags (movement pattern OR name substring)
    ("knee",        5, 10, 21, ["squat", "lunge", "plyometric", "jump"]),
    ("shoulder",    5, 10, 21, ["push_vertical", "press", "fly", "dip"]),
    ("lower_back",  7, 14, 30, ["hinge", "deadlift", "good morning", "hyperextension"]),
    ("ankle",       5, 10, 21, ["plyometric", "jump", "calf raise", "run"]),
    ("wrist",       5, 10, 21, ["push-up", "push_horizontal", "press", "curl"]),
    ("neck",        3,  7, 14, ["shrug", "neck"]),
    ("elbow",       5, 10, 21, ["curl", "extension", "dip", "push_horizontal"]),
    ("hip",         5, 10, 21, ["squat", "lunge", "hinge", "hip"]),
]

class Command(BaseCommand):
    help = "Seed injury type templates"

    def handle(self, *args, **o):
        for part, mild, mod, sev, tags in TEMPLATES:
            InjuryTypeTemplate.objects.update_or_create(
                body_part=part,
                defaults={"mild_days": mild, "moderate_days": mod,
                          "severe_days": sev, "avoid_exercises_tagged": tags},
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(TEMPLATES)} injury templates"))