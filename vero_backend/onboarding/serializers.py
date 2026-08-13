from rest_framework import serializers
from .models import OnboardingProfile, BuildTemplate, PhysiqueProfile


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
            "equipment",
            "time_per_session",
            "days_per_week",
            "training_style",
            "workout_focus",
            "sleep_hours",
            "stress_level",
            "smokes_or_drinks",
            "eating_habits"
            "age",
            "gender",
            "weight_kg",
            "height_cm",
            "experience_level",
            "dietary_restrictions",
            "cuisine_preferance",
            "ai_exclusions",
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
    
class BuildTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildTemplate
        fields = ["id", "name", "description", "somatotype", "image_url",
                  "lagging_muscles", "developed_muscles", "posture_notes",
                  "training_focus", "is_active"]
        
class PhysiqueProfileSerializer(serializers.ModelSerializer):
    build_template = BuildTemplateSerializer(read_only=True)

    class Meta:
        model = PhysiqueProfile
        fields = ["id", "somatotype", "estimated_body_fat_range", "lagging_muscles",
                  "developed_muscles", "training_focus", "target_calories",
                  "target_protein_g", "target_carbs_g", "target_fats_g",
                  "is_current", "build_template"]
              
class CreatePhysiqueFromTemplateSerializer(serializers.Serializer):
    build_template_id = serializers.IntegerField()
    auto_generate_plan = serializers.BooleanField(default=True)
    
    def validate_build_template_id(self, value):
        if not BuildTemplate.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Build template not found or inactive.")
        return value