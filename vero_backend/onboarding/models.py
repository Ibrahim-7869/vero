from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings

# Create your models here.

class OnboardingProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="onboarding_profile",
    )

    # Step 1
    has_injuries = models.BooleanField(null=True, blank=True)
    injury_details = models.TextField(blank=True, null=True)
    takes_medication = models.BooleanField(null=True, blank=True)
    medication_details = models.TextField(blank=True, null=True)
    has_doctor_restriction = models.BooleanField(null=True, blank=True)
    doctor_restriction_details = models.TextField(blank=True, null=True)

    #Step 2
    class Goal(models.TextChoices):
        LOSE_WEIGHT = "lose_weight", "Lose Weight"
        BUILD_MUSCLE = "build_muscle", "Build muscle"
        GENERAL_FITNESS = "general_fitness", "General fitness"
        TONE = "tone", "Tone and sculpt"

    class SuccessVision(models.TextChoices):
        FITTER = "noticeably_fitter", "noticeably fitter"
        CLOTHING_SIZE = "clothing_size", "Down a clothing size"
        HABIT = "consistent_habit", "Consistent habit build"
        MUSCLE_DEFINITION = "muscle_definition", "Visible muscle definition"
        OTHER = "other", "something else"

    class BodyType(models.TextChoices):
        SLIM = "slim", "Slim"
        AVERAGE = "average", "Average"
        ATHLETIC = "athletic", "Athletic"
        LARGER_BUILD = "larger_build", "Larger build"

    primary_goal = models.CharField(max_length=20, choices=Goal.choices)
    success_vision = models.CharField(max_length=20, choices=SuccessVision.choices)
    body_type = models.CharField(max_length=20, choices=BodyType.choices)
    success_vision_other = models.CharField(max_length=255, blank=True, null=True)


    #Step 3
    EQUIPMENT_CHOICES = [
        ("no_equipment", "No equipment"),
        ("dumbbells", "Dumbbells"),
        ("resistance_bands", "Resistance bands"),
        ("yoga_mat", "Yoga mat"),
        ("bench", "Bench"),
        ("kettlebells", "Kettlebells"),
    ]
    equipment = ArrayField(
        models.CharField(max_length=30, choices=EQUIPMENT_CHOICES),
        default=list,
        blank=True,
    )
    time_per_session = models.PositiveSmallIntegerField()
    days_per_week = models.PositiveSmallIntegerField()

    #step 4
    class TrainingStyle(models.TextChoices):
        SIMPLE ="keep_it_simple", "Keep it simple"
        OPEN_TO_LEARNING ="open_to_learning", "Open to learning"

    class WorkoutFocus(models.TextChoices):
        CARDIO = "cardio", "Cardio"
        STRENGTH = "strength", "Strength training"
        MIX = "mix", "A mix of both"

    training_style = models.CharField(max_length=20, choices=TrainingStyle.choices)
    workout_focus = models.CharField(max_length= 20, choices=WorkoutFocus.choices)

    #Step 5
    class SleepHours(models.TextChoices):
        UNDER_5 = "under_5", "Under 5h"
        FIVE_TO_SEVEN = "5_7", "5-7h"
        SEVEN_TO_NINE = "7_9", "7-9h"
        NINE_PLUS = "9_plus", "9h+"

    class StressLevel(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    sleep_hours = models.CharField(max_length=10, choices=SleepHours.choices, null=True, blank=True)
    stress_level = models.CharField(max_length=10, choices=StressLevel.choices, null=True, blank=True)
    smokes_or_drinks = models.BooleanField(null=True, blank=True)

    #Step 6
    class EatingHabits(models.TextChoices):
        CONSISTENT = "consistent", "Pretty consistent"
        INCONSISTENT = "inconsistent", "Somewhat inconsistent"
        CONVENIENCE = "convenience_food", "Mostly convenience food"

    eating_habits = models.CharField(max_length=20, choices=EatingHabits.choices)

    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Onboarding profile for {self.user.email}"
