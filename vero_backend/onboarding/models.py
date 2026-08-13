from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings


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

    # Step 2
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

    primary_goal = models.CharField(max_length=20, choices=Goal.choices)
    success_vision = models.CharField(max_length=20, choices=SuccessVision.choices)
    success_vision_other = models.CharField(max_length=255, blank=True, null=True)

    # Step 3
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

    # Step 4
    class TrainingStyle(models.TextChoices):
        SIMPLE = "keep_it_simple", "Keep it simple"
        OPEN_TO_LEARNING = "open_to_learning", "Open to learning"

    class WorkoutFocus(models.TextChoices):
        CARDIO = "cardio", "Cardio"
        STRENGTH = "strength", "Strength training"
        MIX = "mix", "A mix of both"

    training_style = models.CharField(max_length=20, choices=TrainingStyle.choices)
    workout_focus = models.CharField(max_length=20, choices=WorkoutFocus.choices)

    # Step 5
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

    # Step 6
    class EatingHabits(models.TextChoices):
        CONSISTENT = "consistent", "Pretty consistent"
        INCONSISTENT = "inconsistent", "Somewhat inconsistent"
        CONVENIENCE = "convenience_food", "Mostly convenience food"

    eating_habits = models.CharField(max_length=20, choices=EatingHabits.choices)

    ai_exclusions = models.JSONField(default=list, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # ─── Biometrics ────────────────────────────────────────────────
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Prefer not to say"

    class ExperienceLevel(models.TextChoices):
        NOVICE = "novice", "Complete Beginner (never trained)"
        BEGINNER = "beginner", "Beginner (< 6 months)"
        INTERMEDIATE = "intermediate", "Intermediate (6 mo - 2 yrs)"
        ADVANCED = "advanced", "Advanced (2+ yr)"

    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=20, choices=Gender.choices, null=True, blank=True
    )  # ← ADDED: needed for BMR calculation
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    experience_level = models.CharField(
        max_length=20, choices=ExperienceLevel.choices, default=ExperienceLevel.NOVICE
    )
    
    class DietaryRestriction(models.TextChoices):
        NONE = "none", "No restriction"
        HALAL = "halal", "Halal"
        KOSHER = "kosher", "Kosher"
        VEGETARIAN = "vegetarian", "Vegetarian"
        VEGAN = "vegan", "Vegan"
        
    dietary_restriction = models.CharField(
        max_length=20,
        choices=DietaryRestriction.choices,
        default=DietaryRestriction.NONE,
        blank=True,
    )
    cuisine_preference = models.CharField(max_length=50, blank=True, default="")

    def __str__(self):
        return f"Onboarding profile for {self.user.email}"


class BuildTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True, null=True)
    somatotype = models.CharField(max_length=50)
    estimated_body_fat_range = models.CharField(max_length=20)
    lagging_muscles = ArrayField(models.CharField(max_length=100), default=list)
    developed_muscles = ArrayField(models.CharField(max_length=100), default=list)
    posture_notes = models.TextField(blank=True)
    training_focus = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PhysiqueProfile(models.Model):
    class Source(models.TextChoices):
        PHOTO = "photo", "User Photo"
        INTERNET_IMAGE = "internet_image", "Internet Image"
        BUILD_TEMPLATE = "build_template", "Predefined Build"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="physique_profiles"
    )
    build_template = models.ForeignKey(
        BuildTemplate, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="profiles"  # ← FIXED: was "related_names"
    )
    source = models.CharField(max_length=20, choices=Source.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    error_message = models.TextField(blank=True)

    # AI analysis results
    somatotype = models.CharField(max_length=50, blank=True)
    estimated_body_fat_range = models.CharField(max_length=20, blank=True)
    lagging_muscles = ArrayField(models.CharField(max_length=100), default=list)
    developed_muscles = ArrayField(models.CharField(max_length=100), default=list)
    posture_notes = models.TextField(blank=True)
    training_focus = models.TextField(blank=True)  # ← added blank=True

    # Biometric snapshot at time of analysis
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Calculated metrics
    bmi = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    bmr = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    tdee = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    target_calories = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    target_protein_g = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    target_carbs_g = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    target_fats_g = models.DecimalField(max_digits=6, decimal_places=0, null=True, blank=True)
    
    # ─── MediaPipe geometric metrics (research comparison) ─────────
    shoulder_to_hip_ratio = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    shoulder_tilt = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    symmetry_score = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    geometric_somatotype_estimate = models.CharField(max_length=50, blank=True)

    is_current = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.somatotype or 'pending'}"

    def save(self, *args, **kwargs):
        # Ensure only one "current" profile per user
        if self.is_current:
            PhysiqueProfile.objects.filter(user=self.user, is_current=True).exclude(
                pk=self.pk
            ).update(is_current=False)
        super().save(*args, **kwargs)