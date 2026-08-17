from datetime import date
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Injury, InjuryCheckIn
from .serializers import InjuryCheckInSerializer, InjurySerializer
from . import services

# Create your views here.

class InjuryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        injuries = Injury.objects.filter(user=request.user, is_active=True)
        due = InjuryCheckIn.objects.filter(
            injury__user=request.user, status="pending", scheduled_date__lte=date.today()
        )
        return Response({
            "injuries": InjurySerializer(injuries, many=True).data,
            "due_check_ins": InjuryCheckInSerializer(due, many=True).data,
        })
        
    def post(self, request):
        body_part = request.data.get("body_part")
        if not body_part:
            return Response({"error": "body_part is required."}, status=400)
        doctor_days = request.data.get("doctor_rest_days")
        injury = services.report_injury(
            request.user, body_part,
            request.data.get("severity", "moderate"),
            request.data.get("description", ""),
            int(doctor_days) if doctor_days else None,
        )      
        return Response(InjurySerializer(injury).data, status=201)    
class CheckInRespondView(APIView):
      permission_classes = [IsAuthenticated]
      
      def post(self, request, check_in_id):
        check_in = InjuryCheckIn.objects.filter(id=check_in_id, injury__user=request.user).first()
        if not check_in:
            return Response({"error": "Check-in not found."}, status=404)
        user_response = request.data.get("user_response")
        if user_response not in dict(InjuryCheckIn.UserResponse.choices):
            return Response({"error": "Invalid response."}, status=400)
        injury = services.respond_to_check_in(
            check_in, user_response, request.data.get("pain_level"), request.data.get("notes", ""))
        return Response(InjurySerializer(injury).data)