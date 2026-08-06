from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SignupSerializer, UserSerializer, ChangePasswordSerializer
from .utils import send_verification_email

User = get_user_model()

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        send_verification_email(user)

        return Response(
            {
                "message": "Account created, Please check your email to verify your account.",
                "user" : UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Missing token."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response({"error": "Invalid verification link"}, status.HTTP_400_BAD_REQUEST)
        if user.email_verified:
            return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)
        if user.is_verification_token_expired():
            return Response(
            {"error": "This verification link has expired. Please request a new one"}, 
            status=status.HTTP_400_BAD_REQUEST,
        )

        user.email_verified = True
        user.email_verification_token = None
        user.save(update_fields=["email_verified", "email_verification_token"])

        return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)

class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self,request):
        email = request.data.get("email")
        try:
            user = User.objects(email=email)
        except User.DoesNotExist:
            return Response({"message": "If an account exists, a verification email has been sent."})
        

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        return Response(UserSerializer(request.user).data)
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"message": "Password updated successfully."})