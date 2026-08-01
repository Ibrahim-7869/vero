from django.urls import path
from .views import ActivePlanView, GeneratePlanView, RegeneratePlanView, WorkoutDayDetailView

urlpatterns = [
    path("active/", ActivePlanView.as_view(), name="active-plan"),
    path("generate/", GeneratePlanView.as_view(), name="generate-plan"),
    path("regenerate/", RegeneratePlanView.as_view(), name="regenerate-plan"),
    path("days/<int:day_id>/", WorkoutDayDetailView.as_view(), name="workout-day-detail"),
]