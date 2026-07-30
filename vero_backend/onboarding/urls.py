from django.urls import path
from .views import OnboardingProfileView

urlpatterns = [
    path("profile/", OnboardingProfileView.as_view(), name="onboarding-profile"),
]

