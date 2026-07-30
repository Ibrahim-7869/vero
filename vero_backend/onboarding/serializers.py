from rest_framework import serializers
from .models import OnboardingProfile


class OnboardingProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingProfile
        fields = [
            "id",
            "has_injuries",
            "injury_details",
            "takes_medication",
            "medication_details",
            "has_doctor_restriction",
            "doctor_restriction_details",
            "primary_goal",
            "success_vision",
            "success_vision_other",
            "body_type",
            "equipment",
            "time_per_session",
            "days_per_week",
            "training_style",
            "workout_focus",
            "sleep_hours",
            "stress_level",
            "smokes_or_drinks",
            "eating_habits",
            "completed_at",
        ]
        read_only_fields = ["id", "completed_at"]

    def validate(self, data):
        if data.get("has_injuries") and not data.get("injury_details"):
            raise serializers.ValidationError(
                {"injury_details": "Please describe the injury since you selected 'Yes'."}
            )
        if data.get("takes_medication") and not data.get("medication_details"):
            raise serializers.ValidationError(
                {"medication_details": "Please describe the medication since you selected 'Yes'."}
            )
        if data.get("has_doctor_restriction") and not data.get("doctor_restriction_details"):
            raise serializers.ValidationError(
                {"doctor_restriction_details": "Please describe the restriction since you selected 'Yes'."}
            )
        if data.get("success_vision") == "other" and not data.get("success_vision_other"):
            raise serializers.ValidationError(
                {"success_vision_other": "Please specify since you selected 'Something else'."}
            )
        return data