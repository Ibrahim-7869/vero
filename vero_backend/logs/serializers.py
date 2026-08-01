from rest_framework import serializers
from .models import WorkoutSession, ExerciseLog


class ExerciseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseLog
        fields = [
            "id",
            "workout_exercise",
            "completed_sets",
            "completed_reps",
            "weight_used",
            "skipped",
            "reported_pain",
            "pain_details",
        ]
        read_only_fields = ["id"]

class WorkoutSessionSerializer(serializers.ModelSerializer):
    exercise_log = ExerciseLogSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            "id",
            "workout_day",
            "date",
            "status",
            "feedback",
            "duration_minutes",
            "calories_burned",
            "exercise_log",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]