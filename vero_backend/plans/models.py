from django.conf import settings
from django.db import models
from exercises.models import Exercise


class WorkoutPlan(models.Model):
    class GeneratedReason(models.TextChoices):
        INITIAL = "initial", "Initial plan"
        AI_ADJUSTMENT = "ai_adjustment", "AI adjustment"
        USER_REQUESTED = "user_requested", "User requested"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workout_plans")
    is_active = models.BooleanField(default=True)
    generated_reason = models.CharField(max_length=20, choices=GeneratedReason.choices, default=GeneratedReason.INITIAL)
    adjustment_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Plan for {self.user.email} ({'active' if self.is_active else 'inactive'})"


class WorkoutDay(models.Model):
    plan = models.ForeignKey(WorkoutPlan, on_delete=models.CASCADE, related_name="days")
    day_number = models.PositiveSmallIntegerField()  # 1-7, position in weekly template
    label = models.CharField(max_length=100)          # e.g. "Upper Body Power", "Rest Day"
    is_rest_day = models.BooleanField(default=False)
    estimated_duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["day_number"]
        unique_together = ("plan", "day_number")

    def __str__(self):
        return f"Day {self.day_number}: {self.label}"


class WorkoutExercise(models.Model):
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.CASCADE, related_name="exercises")
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT, related_name="+")
    order = models.PositiveSmallIntegerField()
    sets = models.PositiveSmallIntegerField()
    reps = models.CharField(max_length=20)  # e.g. "12", "8-10", "AMRAP"
    rest_seconds = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.exercise.name} ({self.sets}x{self.reps})"