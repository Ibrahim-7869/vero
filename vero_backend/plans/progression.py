from logs.models import WorkoutSession, ExerciseLog


def analyze_user_progression(user, lookback_sessions=4):
    """
    Analyzes a user's recent workout history to determine adjustment signals.
    """
    recent_sessions = list(
        WorkoutSession.objects.filter(
            user=user, status=WorkoutSession.Status.COMPLETED
        ).order_by("-date")[:lookback_sessions]
    )

    if not recent_sessions:
        return {"action": "none", "reason": "No completed sessions yet."}

    session_ids = [s.id for s in recent_sessions]

    pain_reports = ExerciseLog.objects.filter(
        session_id__in=session_ids, reported_pain=True
    ).select_related("workout_exercise__exercise")

    too_hard_count = sum(1 for s in recent_sessions if s.feedback == WorkoutSession.Feedback.TOO_HARD)
    too_easy_count = sum(1 for s in recent_sessions if s.feedback == WorkoutSession.Feedback.TOO_EASY)

    skipped_count = WorkoutSession.objects.filter(
        user=user, status=WorkoutSession.Status.SKIPPED
    ).order_by("-date")[:lookback_sessions].count()

    if pain_reports.exists():
        affected_muscles = set()
        for log in pain_reports:
            affected_muscles.update(log.workout_exercise.exercise.target_muscles)
        return {
            "action": "reduce_and_exclude",
            "reason": f"Reported pain on: {', '.join(affected_muscles)}",
            "extra_exclusions": list(affected_muscles),
        }

    if skipped_count >= 2:
        return {
            "action": "reduce_intensity",
            "reason": f"Missed {skipped_count} of last {lookback_sessions} sessions. Reducing intensity to rebuild consistency.",
        }

    if too_hard_count >= 2:
        return {
            "action": "reduce_intensity",
            "reason": f"Reported 'too hard' {too_hard_count} times recently.",
        }

    if too_easy_count >= 2:
        return {
            "action": "increase_intensity",
            "reason": f"Reported 'too easy' {too_easy_count} times recently. Increasing challenge.",
        }

    return {"action": "hold", "reason": "Performance is consistent with current plan. Holding steady."}