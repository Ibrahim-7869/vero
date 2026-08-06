from rest_framework import serializers
from .models import WorkoutSession, ExerciseLog
from plans.serializers import WorkoutDaySerializer


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

class ExerciseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseLog
        fields = [
            "id", "workout_exercise", "completed_sets", "completed_reps",
            "weight_used", "skipped", "reported_pain", "pain_details",
        ]
        read_only_fields = ["id"]

class WorkoutSessionSerializer(serializers.ModelSerializer):
    exercise_logs = ExerciseLogSerializer(many=True, read_only=True)
    workout_day_detail = WorkoutDaySerializer(source="workout_day", read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            "id", "workout_day", "workout_day_detail", "date", "status", "feedback",
            "duration_minutes", "calories_burned", "created_at", "exercise_logs",
        ]
        read_only_fields = ["id", "created_at"]