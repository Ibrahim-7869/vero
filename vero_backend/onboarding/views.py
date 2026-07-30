from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView 
from rest_framework.response import Response

from .models import OnboardingProfile
from .serializers import OnboardingProfileSerializer

# Create your views here.

class OnboardingProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            profile = request.user.onboarding_profile
        except OnboardingProfile.DoesNotExist:
            return Response(
                {"error": "Onbaording Profile not started yet."},
                status=status.HHTP_404_NOT_FOUND,
            )
    
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