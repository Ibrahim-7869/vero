from django.contrib.postgres.fields import ArrayField
from django.db import models


class Exercise(models.Model):
    external_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    gif_url = models.URLField(blank=True, null=True)

    body_parts = ArrayField(models.CharField(max_length=100), default=list)
    equipments = ArrayField(models.CharField(max_length=100), default=list)
    target_muscles = ArrayField(models.CharField(max_length=100), default=list)
    secondary_muscles = ArrayField(models.CharField(max_length=100), default=list, blank=True)

    instructions = models.JSONField(default=list)

    is_home_friendly = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    
    class MovementPattern(models.TextChoices):
        PUSH_HORIZONTAL = "push_horizontal", "Horizontal Push"
        PUSH_VERTICAL = "push_vertical", "Vertical Push"
        PULL_HORIZONTAL = "pull_horizontal", "Horizontal Pull"
        PULL_VERTICAL = "pull_vertical", "Vertical Pull"
        SQUAT = "squat", "Squat"
        HINGE = "hinge", "Hip Hinge"
        LUNGE = "lunge", "Lunge"
        CORE = "core", "Core"
        ISOLATION_UPPER = "isolation_upper", "Upper Isolation"
        ISOLATION_LOWER = "isolation_lower", "Lower Isolation"
        PLYOMETRIC = "plyometric", "Plyometric"
        FULL_BODY = "full_body", "Full Body"
        
    difficulty_level = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="1 (easiest) to 5 (hardest). AI-assigned + audited."
    )
    movement_pattern = models.CharField(
        MovementPattern.choices, null=True, blank=True
    )
    def __str__(self):
        return self.name