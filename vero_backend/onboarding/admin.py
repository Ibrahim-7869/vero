from django.contrib import admin
from .models import OnboardingProfile

# Register your models here.

@admin.register(OnboardingProfile)
class OnboardingProfileAdmin(admin.ModelAdmin):
    list_display = (
            "user",
        "primary_goal",
        "body_type",
        "days_per_week",
        "time_per_session",
        "completed_at",
    )
    list_filter = ("primary_goal", "body_type", "training_style", "workout_focus")
    search_fields = ("user__username", "user__email")
