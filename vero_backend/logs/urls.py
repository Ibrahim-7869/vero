from django.urls import path
from .views import StartSessionView, LogExerciseView, CompleteSessionView, SessionHistoryView


urlpatterns = [
    path("sessions/start/", StartSessionView.as_view(), name="start-session"),
    path("sessions/<int:session_id>/log-exercise/", LogExerciseView.as_view(), name="log-exercise"),
    path("sessions/<int:session_id>/complete/", CompleteSessionView.as_view(), name="complete-session"),
    path("sessions/history/", SessionHistoryView.as_view(), name="session-history"),
]