from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView 
from rest_framework.response import Response

from .models import OnboardingProfile, BuildTemplate
from .serializers import OnboardingProfileSerializer, BuildTemplateSerializer, PhysiqueProfileSerializer, CreatePhysiqueFromTemplateSerializer
from onboarding.services.profile_builder import build_profile_from_template
from plans.services import generate_workout_plan
# Create your views here.

class OnboardingProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            profile = request.user.onboarding_profile
        except OnboardingProfile.DoesNotExist:
            return Response(
            {"error": "Onboarding profile not started yet."},
            status=status.HTTP_404_NOT_FOUND,
        )
        return Response(OnboardingProfileSerializer(profile).data)
    
    def post(self,request):
        if hasattr(request.user, "onboarding_profile"):
            return Response(
                {"error": "Onboarding already completed. Use PATCH to update"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = OnboardingProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, completed_at=timezone.now())

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        try:
            profile = request.user.onboarding_profile
        except OnboardingProfile.DoesNotExist:
            return Response(
                {"error": "Onboarding profile not found. Please POST one first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OnboardingProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
    
class BuildTemplateListView(APIView):
    """GET /api/onboarding/templates/ — list all available body types."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        templates = BuildTemplate.objects.filter(is_active=True).order_by("id")
        return Response(BuildTemplateSerializer(templates, many=True).data)


class PhysiqueProfileCreateView(APIView):
    """POST /api/onboarding/physique/ — create a profile from a build template."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            _ = request.user.onboarding_profile
        except OnboardingProfile.DoesNotExist:
            return Response(
                {"error": "Complete onboarding before selecting a body type."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreatePhysiqueFromTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        template = BuildTemplate.objects.get(id=serializer.validated_data["build_template_id"])

        try:
            physique = build_profile_from_template(request.user, template)
        except Exception as e:
            return Response(
                {"error": f"Failed to create physique profile: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_data = {"physique": PhysiqueProfileSerializer(physique).data}

        if serializer.validated_data.get("auto_generate_plan", True):
            try:
                plan = generate_workout_plan(request.user, physique=physique)
                from plans.serializers import WorkoutPlanSerializer
                response_data["plan"] = WorkoutPlanSerializer(plan).data
            except Exception as e:
                response_data["plan_error"] = str(e)

        return Response(response_data, status=status.HTTP_201_CREATED)


class PhysiqueProfileCurrentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        physique = request.user.physique_profiles.filter(is_current=True).first()
        if not physique:
            return Response(
                {"error": "No physique profile yet. Select a body type first."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(PhysiqueProfileSerializer(physique).data)


class PhysiqueProfileListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profiles = request.user.physique_profiles.all()
        return Response(PhysiqueProfileSerializer(profiles, many=True).data)


class PhysiqueProfileListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profiles = request.user.physique_profiles.all()
        return Response(PhysiqueProfileSerializer(profiles, many=True).data)