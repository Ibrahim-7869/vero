from django.urls import path
from .views import OnboardingProfileView, BuildTemplateListView, PhysiqueProfileCreateView, PhysiqueProfileCurrentView

urlpatterns = [
    path("profile/", OnboardingProfileView.as_view(), name="onboarding-profile"),
    path("templates/", BuildTemplateListView.as_view(), name="build-templates"),
    path("physique/", PhysiqueProfileCreateView.as_view(), name="physique-create"),
    path("physique/current/", PhysiqueProfileCurrentView.as_view(), name="physique-current"),
    ]

