from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from plans.models import WorkoutDay, WorkoutExercise
from .models import WorkoutSession, ExerciseLog
from .serializers import WorkoutSessionSerializer, ExerciseLogSerializer

# Create your views here.

class StartSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        workout_day_id = request.data.get("workout_day")
        try:
            workout_day = WorkoutDay.objects.get(id=workout_day_id, plan__user=request.user, plan__is_active=True)
        except WorkoutDay.DoesNotExist:
            return Response({"error": "Invalid workout day for your active plan."}, status=status.HTTP_400_BAD_REQUEST)

        session = WorkoutSession.objects.create(
            user=request.user,
            workout_day=workout_day,
            date=request.data.get("date"),
            status=WorkoutSession.Status.IN_PROGRESS,
        )        
        return Response(WorkoutSessionSerializer(session).data, status=status.HTTP_201_CREATED)

class LogExerciseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = WorkoutSession.objects.get(id=session_id, user=request.user)
        except WorkoutSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        workout_exercise_id = request.data.get("workout_exercise")
        try:
            workout_exercise = WorkoutExercise.objects.get(id=workout_exercise_id)
        except WorkoutExercise.DoesNotExist:
            return Response({"error": "Invalid workout exercise."}, status=status.HTTP_400_BAD_REQUEST)

        log, _ = ExerciseLog.objects.update_or_create(
            session=session,
            workout_exercise=workout_exercise,
            defaults={
                "completed_sets": request.data.get("completed_sets", 0),
                "completed_reps": request.data.get("completed_reps", ""),
                "weight_used": request.data.get("weight_used"),
                "skipped": request.data.get("skipped", False),
                "reported_pain": request.data.get("reported_pain", False),
                "pain_details": request.data.get("pain_details", ""),
            },
        )
        return Response(ExerciseLogSerializer(log).data, status=status.HTTP_200_OK)

class CompleteSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = WorkoutSession.objects.get(id=session_id, user=request.user)
        except WorkoutSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        session.status = WorkoutSession.Status.COMPLETED
        session.feedback = request.data.get("feedback")
        session.duration_minutes = request.data.get("duration_minutes")
        session.calories_burned = request.data.get("calories_burned")
        session.save()

        return Response(WorkoutSessionSerializer(session).data, status=status.HTTP_200_OK)

class SessionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = WorkoutSession.objects.filter(user=request.user).order_by("-date")
        return Response(WorkoutSessionSerializer(sessions, many=True).data)