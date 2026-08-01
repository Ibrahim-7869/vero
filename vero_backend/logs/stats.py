from datetime import timedelta
from django.utils import timezone
from .models import WorkoutSession


def get_user_stats(user):
    all_sessions = WorkoutSession.objects.filter(user=user)
    completed_sessions = all_sessions.filter(status=WorkoutSession.Status.COMPLETED).order_by("-date")

    total_workouts = completed_sessions.count()

    # Current streak: count consecutive days (going backward from most recent) with a completed session
    current_streak = 0
    dates = list(completed_sessions.values_list("date", flat=True))
    if dates:
        expected_date = dates[0]
        for d in dates:
            if d == expected_date:
                current_streak += 1
                expected_date = expected_date - timedelta(days=1)
            elif d < expected_date:
                break

    # Adherence rate: completed sessions vs. (completed + skipped) over the last 30 days
    thirty_days_ago = timezone.now().date() - timedelta(days=30)
    recent_sessions = all_sessions.filter(date__gte=thirty_days_ago)
    recent_completed = recent_sessions.filter(status=WorkoutSession.Status.COMPLETED).count()
    recent_total = recent_sessions.exclude(status=WorkoutSession.Status.IN_PROGRESS).count()
    adherence_rate = round((recent_completed / recent_total) * 100) if recent_total > 0 else None

    # Consistency data for the last 8 weeks (for the heatmap/chart)
    eight_weeks_ago = timezone.now().date() - timedelta(weeks=8)
    consistency_sessions = completed_sessions.filter(date__gte=eight_weeks_ago)
    consistency_dates = [d.isoformat() for d in consistency_sessions.values_list("date", flat=True)]

    return {
        "total_workouts": total_workouts,
        "current_streak": current_streak,
        "adherence_rate": adherence_rate,
        "consistency_dates": consistency_dates,
    }