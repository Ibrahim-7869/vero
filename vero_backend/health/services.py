from datetime import date, timedelta
from django.utils import timezone
from exercises.models import Exercise
from plans.models import WorkoutPlan
from plans.services import regenerate_plan_with_progression
from .models import Injury, InjuryCheckIn, InjuryTypeTemplate


def _is_risky(ex, avoid):
    return (ex.movement_pattern or "").lower() in avoid or any(t in ex.name.lower() for t in avoid)


def apply_injury_adjustments(user, injury):
    """Swap risky exercises in the active plan for safe same-muscle alternatives."""
    tpl = InjuryTypeTemplate.objects.filter(body_part=injury.body_part).first()
    if not tpl:
        return 0
    avoid = [a.lower() for a in tpl.avoid_exercises_tagged]
    plan = WorkoutPlan.objects.filter(user=user, is_active=True).first()
    if not plan:
        return 0

    catalog = list(Exercise.objects.filter(is_active=True))
    swapped = 0
    for day in plan.days.filter(is_rest_day=False):
        for we in list(day.exercises.select_related("exercise").all()):
            ex = we.exercise
            if not _is_risky(ex, avoid):
                continue
            ex_muscles = set(ex.target_muscles or [])
            pool = [e for e in catalog if e.id != ex.id and not _is_risky(e, avoid)]
            pool.sort(key=lambda e: (
                -len(set(e.target_muscles or []) & ex_muscles),
                abs((e.difficulty_level or 2) - (ex.difficulty_level or 2)),
            ))
            if pool:
                we.exercise = pool[0]
                we.save()
                swapped += 1
    return swapped


def report_injury(user, body_part, severity, description="", doctor_rest_days=None):
    tpl = InjuryTypeTemplate.objects.filter(body_part=body_part).first()
    if doctor_rest_days:
        rest, source = doctor_rest_days, Injury.RestSource.DOCTOR
    else:
        rest = tpl.rest_day_for(severity) if tpl else 7
        source = Injury.RestSource.SYSTEM

    today = date.today()
    injury = Injury.objects.create(
        user=user, body_part=body_part, severity=severity, description=description,
        rest_period_days=rest, rest_period_source=source,
        recovery_start_date=today, expected_recovery_date=today + timedelta(days=rest),
    )
    InjuryCheckIn.objects.create(injury=injury, scheduled_date=injury.expected_recovery_date)
    apply_injury_adjustments(user, injury)
    return injury


def respond_to_check_in(check_in, user_response, pain_level=None, notes=""):
    check_in.status = InjuryCheckIn.Status.COMPLETED
    check_in.user_response = user_response
    check_in.pain_level = pain_level
    check_in.notes = notes
    check_in.completed_at = timezone.now()
    check_in.save()

    injury = check_in.injury
    today = date.today()

    if user_response == InjuryCheckIn.UserResponse.FULLY_RECOVERED:
        injury.status = Injury.Status.RECOVERED
        injury.is_active = False
        injury.save()
        regenerate_plan_with_progression(injury.user, reason=f"recovered from {injury.body_part} injury")
        return injury

    extra = {"partially_recovered": 3, "same": 5, "worse": 7}.get(user_response, 5)
    if user_response == "worse" and injury.severity == Injury.Severity.MILD:
        injury.severity = Injury.Severity.MODERATE
    injury.expected_recovery_date = today + timedelta(days=extra)
    injury.status = Injury.Status.ACTIVE_RECOVERY
    injury.save()
    InjuryCheckIn.objects.create(injury=injury, scheduled_date=injury.expected_recovery_date)
    if user_response == "worse":
        apply_injury_adjustments(injury.user, injury)
    return injury