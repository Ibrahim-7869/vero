import random
from django.utils import timezone
from django.db import transaction

from onboarding.models import OnboardingProfile
from exercises.models import Exercise
from .models import WorkoutPlan, WorkoutDay, WorkoutExercise
from .safety import get_safety_exclusions
from .progression import analyze_user_progression


EQUIPMENT_MAP = {
    "no_equipment": "body weight",
    "dumbbells": "dumbbell",
    "resistance_bands": {"band", "resistance band"},
    "kettlebells": "kettlebell",
}

SCHEDULE_TEMPLATES = {
    2: [
        (1, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (2, "Rest Day", None),
        (3, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (4, "Rest Day", None), (5, "Rest Day", None), (6, "Rest Day", None), (7, "Rest Day", None),
    ],
    3: [
        (1, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (2, "Rest Day", None),
        (3, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (4, "Rest Day", None),
        (5, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (6, "Rest Day", None), (7, "Rest Day", None),
    ],
    4: [
        (1, "Upper Body", ["chest", "back", "shoulders", "upper arms", "waist"]),
        (2, "Lower Body", ["upper legs", "lower legs"]),
        (3, "Rest Day", None),
        (4, "Upper Body", ["chest", "back", "shoulders", "upper arms", "waist"]),
        (5, "Lower Body", ["upper legs", "lower legs"]),
        (6, "Rest Day", None), (7, "Rest Day", None),
    ],
    5: [
        (1, "Upper Body", ["chest", "back", "shoulders", "upper arms", "waist"]),
        (2, "Lower Body", ["upper legs", "lower legs"]),
        (3, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (4, "Rest Day", None),
        (5, "Upper Body", ["chest", "back", "shoulders", "upper arms", "waist"]),
        (6, "Lower Body", ["upper legs", "lower legs"]),
        (7, "Rest Day", None),
    ],
    6: [
        (1, "Upper Body", ["chest", "back", "shoulders", "upper arms", "waist"]),
        (2, "Lower Body", ["upper legs", "lower legs"]),
        (3, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (4, "Upper Body", ["chest", "back", "shoulders", "upper arms", "waist"]),
        (5, "Lower Body", ["upper legs", "lower legs"]),
        (6, "Full Body", ["chest", "back", "upper legs", "shoulders", "upper arms", "waist"]),
        (7, "Rest Day", None),
    ],
}

GOAL_PRESCRIPTION = {
    "lose_weight": {"sets": 3, "reps": "12-15", "rest_seconds": 30},
    "build_muscle": {"sets": 4, "reps": "8-12", "rest_seconds": 75},
    "general_fitness": {"sets": 3, "reps": "10-12", "rest_seconds": 45},
    "tone": {"sets": 3, "reps": "12-15", "rest_seconds": 30},
}


def _get_user_equipment_values(profile):
    """Flatten the user's onboarding equipment choices into actual Exercise.equipments values."""
    values = set()
    for choice in profile.equipment:
        mapped = EQUIPMENT_MAP.get(choice)
        if mapped is None:
            continue
        if isinstance(mapped, set):
            values.update(mapped)
        else:
            values.add(mapped)
    return values


def _select_exercises_for_day(body_parts, user_equipment, all_exclusions, used_exercise_ids, target_total=5):
    selected = []
    num_parts = len(body_parts)
    base_count = target_total // num_parts
    remainder = target_total % num_parts  # first few body parts get one extra

    for i, body_part in enumerate(body_parts):
        per_bodypart = base_count + (1 if i < remainder else 0)

        candidates = Exercise.objects.filter(
            is_home_friendly=True,
            is_active=True,
            body_parts__contains=[body_part],
        ).exclude(id__in=used_exercise_ids)

        valid_candidates = [
            ex for ex in candidates
            if set(ex.equipments).issubset(user_equipment)
        ]

        if all_exclusions:
            valid_candidates = [
                ex for ex in valid_candidates
                if not any(
                    excl.lower() in " ".join(ex.target_muscles + ex.secondary_muscles + ex.body_parts).lower()
                    for excl in all_exclusions
                )
            ]

        if not valid_candidates:
            continue  # nothing safe/available for this body part — skip rather than force a bad match

        picks = random.sample(valid_candidates, min(per_bodypart, len(valid_candidates)))
        selected.extend(picks)
        used_exercise_ids.update(ex.id for ex in picks)

    return selected

def _adjust_prescription(base_prescription, modifier):
    sets = base_prescription["sets"] + modifier
    sets = max(2, min(sets, 5))

    rest = base_prescription["rest_seconds"] - (modifier*10)
    rest = max(15, min(rest, 120))

    return {
        "sets": sets,
        "reps": base_prescription["reps"],
        "rest_seconds": rest,
    }


@transaction.atomic
def generate_workout_plan(user, reason="initial", intensity_modifier=0, extra_exclusions=None, adjustment_note=None):

    try:
        profile = user.onboarding_profile
    except OnboardingProfile.DoesNotExist:
        raise ValueError("User has not completed onboarding yet.")

    # 1. Fetch safety exclusions (from onboarding injury details)
    safety_exclusions = get_safety_exclusions(profile)
    
    # 2. Add any dynamic extra exclusions (from progression analysis)
    if extra_exclusions:
        safety_exclusions.extend(extra_exclusions)
        
    # 3. Add AI-requested exclusions (from chat, e.g. "I hate lunges")
    ai_exclusions = getattr(profile, "ai_exclusions", [])
    
    # 4. Combine them all into one unique list
    all_exclusions = list(set(safety_exclusions + ai_exclusions))

    user_equipment = _get_user_equipment_values(profile)
    template = SCHEDULE_TEMPLATES.get(profile.days_per_week, SCHEDULE_TEMPLATES[3])
    base_prescription = GOAL_PRESCRIPTION.get(profile.primary_goal, GOAL_PRESCRIPTION["general_fitness"])
    prescription = _adjust_prescription(base_prescription, intensity_modifier)

    WorkoutPlan.objects.filter(user=user, is_active=True).update(is_active=False)

    plan = WorkoutPlan.objects.create(user=user, is_active=True, generated_reason=reason, adjustment_note=adjustment_note)

    used_exercise_ids = set()

    for day_number, label, body_parts in template:
        is_rest = body_parts is None
        workout_day = WorkoutDay.objects.create(
            plan=plan,
            day_number=day_number,
            label=label,
            is_rest_day=is_rest,
            estimated_duration_minutes=profile.time_per_session if not is_rest else None,
        )

        if is_rest:
            continue

        exercises = _select_exercises_for_day(
            body_parts, user_equipment, all_exclusions, used_exercise_ids, target_total=5
        )

        for order, exercise in enumerate(exercises, start=1):
            WorkoutExercise.objects.create(
                workout_day=workout_day,
                exercise=exercise,
                order=order,
                sets=prescription["sets"],
                reps=prescription["reps"],
                rest_seconds=prescription["rest_seconds"],
            )

    return plan

def regenerate_plan_with_progression(user, reason="ai_adjustment"):

    analysis = analyze_user_progression(user)
    action = analysis["action"]

    if action == "none":
        return generate_workout_plan(user, reason="initial")

    if action == "reduce_and_exclude":
        return generate_workout_plan(
            user, reason=reason, intensity_modifier=-1,
            extra_exclusions=analysis.get("extra_exclusions", []),
            adjustment_note=analysis["reason"],
        )

    if action == "reduce_intensity":
        return generate_workout_plan(
            user, reason=reason, intensity_modifier=-1, adjustment_note=analysis["reason"],
        )

    if action == "increase_intensity":
        return generate_workout_plan(
            user, reason=reason, intensity_modifier=1, adjustment_note=analysis["reason"],
        )

    return generate_workout_plan(
        user, reason=reason, intensity_modifier=0, adjustment_note=analysis["reason"],
    )
    
def replace_exercise_in_active_plan(user, keyword):
    plan = WorkoutPlan.objects.filter(user=user, is_active=True).first()
    if not plan:
        return 0

    try:
        profile = user.onboarding_profile
        user_equipment = _get_user_equipment_values(profile)
        safety_exclusions = get_safety_exclusions(profile)
        ai_exclusions = getattr(profile, "ai_exclusions", [])
        all_exclusions = list(set(safety_exclusions + ai_exclusions))
    except Exception:
        user_equipment = set()
        all_exclusions = []

    # Find all instances of the exercise in the plan that match the keyword
    workout_exercises = WorkoutExercise.objects.filter(
        workout_day__plan=plan, 
        exercise__name__icontains=keyword
    )

    replaced_count = 0
    # Get all exercise IDs currently in the plan so we don't duplicate them
    current_exercise_ids = set(WorkoutExercise.objects.filter(workout_day__plan=plan).values_list('exercise_id', flat=True))

    for we in workout_exercises:
        original_ex = we.exercise
        
        # Find candidates that match the SAME body parts
        if not original_ex.body_parts:
            continue # Can't match a replacement if we don't know the body part
            
        candidates = Exercise.objects.filter(
            is_home_friendly=True,
            is_active=True,
            body_parts__overlap=original_ex.body_parts, # Postgres array overlap
        ).exclude(id__in=current_exercise_ids).exclude(id=original_ex.id)

        # Filter by equipment
        valid_candidates = [
            ex for ex in candidates
            if set(ex.equipments).issubset(user_equipment)
        ]

        # Filter out safety/AI exclusions
        if all_exclusions:
            valid_candidates = [
                ex for ex in valid_candidates
                if not any(
                    excl.lower() in " ".join(ex.target_muscles + ex.secondary_muscles + ex.body_parts).lower()
                    for excl in all_exclusions
                )
            ]

        if valid_candidates:
            # Pick a random valid replacement
            new_ex = random.choice(valid_candidates)
            we.exercise = new_ex
            we.save() # Save the swap (keeps the same sets, reps, order, and day!)
            
            # Add the new exercise to our list so we don't pick it again for another swap
            current_exercise_ids.add(new_ex.id)
            replaced_count += 1

    return replaced_count