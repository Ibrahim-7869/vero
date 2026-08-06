from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import WorkoutPlan
from .serializers import WorkoutPlanSerializer
from .services import generate_workout_plan, regenerate_plan_with_progression


class ActivePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plan = WorkoutPlan.objects.filter(user=request.user, is_active=True).first()
        if not plan:
            return Response({"error": "No active plan yet."}, status=status.HTTP_404_NOT_FOUND)
        return Response(WorkoutPlanSerializer(plan).data)


class GeneratePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            plan = generate_workout_plan(request.user, reason="initial")
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(WorkoutPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class RegeneratePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            plan = regenerate_plan_with_progression(request.user)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(WorkoutPlanSerializer(plan).data, status=status.HTTP_200_OK)


class WorkoutDayDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, day_id):
        plan = WorkoutPlan.objects.filter(user=request.user, is_active=True).first()
        if not plan:
            return Response({"error": "No active plan."}, status=status.HTTP_404_NOT_FOUND)
        day = plan.days.filter(id=day_id).first()
        if not day:
            return Response({"error": "Day not found in your active plan."}, status=status.HTTP_404_NOT_FOUND)
        from .serializers import WorkoutDaySerializer
        return Response(WorkoutDaySerializer(day).data)
    
class RecentAdjustmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        adjustments = WorkoutPlan.objects.filter(
            user=request.user,
            generated_reason="ai_adjustment",
        ).order_by("-created_at")[:5]
        
        data = [
            {
                "note": plan.adjustment_note,
                "created_at": plan.created_at.strftime("%b %d"),
            }
            for plan in adjustments
            if plan.adjustment_note
        ]
        return Response(data)