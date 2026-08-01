from django.db import models
from django.conf import settings
from plans.models import WorkoutDay, WorkoutExercise

# Create your models here.

class WorkoutSession(models.Model):
    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"
        IN_PROGRESS = "in_progress", "In progress"

    class Feedback(models.TextChoices):
        TOO_EASY = "too_easy", "Too easy"
        JUST_RIGHT = "just_right", "Just right"
        TOO_HARD = "too_hard", "Too hard"
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workout_sessions" )
    workout_day = models.ForeignKey(WorkoutDay, on_delete=models.PROTECT, related_name="sessions")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)
    feedback = models.CharField(max_length=20, choices=Feedback.choices, null=True, blank=True)
    duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    calories_burned = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Session for {self.user.email} - {self.date} ({self.status})"


class ExerciseLog(models.Model):
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name="exercise_log")
    workout_exercise = models.ForeignKey(WorkoutExercise, on_delete=models.PROTECT, related_name="+")
    completed_sets = models.PositiveSmallIntegerField(default=0)
    completed_reps = models.CharField(max_length=20, null=True, blank=True)
    weight_used = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    skipped = models.BooleanField(default=False)
    reported_pain = models.BooleanField(default=False)
    pain_details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.workout_exercise.exercise.name} log"
