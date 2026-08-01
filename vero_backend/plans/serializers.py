from rest_framework import serializers
from .models import WorkoutPlan, WorkoutDay, WorkoutExercise


class workoutExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source="exercise.name", read_only=True)
    gif_url = serializers.URLField(source="exercise.gif_url", read_only=True)
    target_muscles = serializers.ListField(source="exercise.target_muscles", read_only=True)
    instructions = serializers.ListField(source="exercise.instructions", read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = [
            "id",
            "order",
            "exercise_name",
            "gif_url",
            "target_muscles",
            "instructions",
            "sets",
            "reps",
            "rest_seconds",
        ]

class WorkoutDaySerializer(serializers.ModelSerializer):
    exercises = workoutExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutDay
        fields = [
            "id",
            "day_number",
            "label",
            "is_rest_day",
            "estimated_duration_minutes",
            "exercises",
        ]

class WorkoutPlanSerializer(serializers.ModelSerializer):
    days = WorkoutDaySerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = [
            "id",
            "is_active",
            "generated_reason",
            "adjustment_note",
            "created_at",
            "days",
        ]