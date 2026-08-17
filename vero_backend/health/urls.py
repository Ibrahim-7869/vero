from django.urls import path
from .views import InjuryView, CheckInRespondView

urlpatterns = [
    path("injuries/", InjuryView.as_view(), name="injuries"),
    path("checkins/<int:check_in_id>/respond/", CheckInRespondView.as_view(), name="checkin-respond"),
]