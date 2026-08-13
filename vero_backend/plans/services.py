import random
from django.utils import timezone
from django.db import transaction

from onboarding.models import OnboardingProfile
from exercises.models import Exercise
from .models import WorkoutPlan, WorkoutDay, WorkoutExercise
from .safety import get_safety_exclusions
from .progression import analyze_user_progression


# ─── Equipment mapping (unchanged) ───────────────────────────────────
EQUIPMENT_MAP = {
    "no_equipment": "body weight",
    "dumbbells": "dumbbell",
    "resistance_bands": {"band", "resistance band"},
    "kettlebells": "kettlebell",
}

# ─── Goal prescriptions (unchanged) ─────────────────────────────────
GOAL_PRESCRIPTION = {
    "lose_weight": {"sets": 3, "reps": "12-15", "rest_seconds": 30},
    "build_muscle": {"sets": 4, "reps": "8-12", "rest_seconds": 75},
    "general_fitness": {"sets": 3, "reps": "10-12", "rest_seconds": 45},
    "tone": {"sets": 3, "reps": "12-15", "rest_seconds": 30},
}

# ─── Experience-level adjustments ────────────────────────────────────
EXPERIENCE_SET_ADJ = {"novice": -1, "beginner": 0, "intermediate": 0, "advanced": 1}
EXPERIENCE_REST_ADJ = {"novice": 10, "beginner": 0, "intermediate": 0, "advanced": -10}
EXPERIENCE_MAX_DIFF = {"novice": 2, "beginner": 3, "intermediate": 4, "advanced": 5}


# ─── Dynamic schedule generation (replaces SCHEDULE_TEMPLATES) ───────
def generate_weekly_template(days_per_week, workout_focus="strength"):
    """Generate a 7-day template dynamically based on training frequency."""
    if workout_focus == "cardio":
        # Cardio-focused: lighter strength work
        focus_sets = 2
        focus_reps = "15-20"
    else:
        focus_sets = None  # will use goal prescription
        focus_reps = None

    if days_per_week <= 2:
        return [
            (1, "Full Body A", ["pectorals", "lats", "delts", "quads", "glutes", "abs"]),
            (2, "Rest Day", None),
            (3, "Full Body B", ["pectorals", "lats", "delts", "quads", "glutes", "abs"]),
            (4, "Rest Day", None), (5, "Rest Day", None), (6, "Rest Day", None), (7, "Rest Day", None),
        ]
    if days_per_week == 3:
        return [
            (1, "Full Body A", ["pectorals", "lats", "delts", "quads", "glutes", "abs"]),
            (2, "Rest Day", None),
            (3, "Full Body B", ["pectorals", "lats", "delts", "quads", "glutes", "abs"]),
            (4, "Rest Day", None),
            (5, "Full Body C", ["pectorals", "lats", "delts", "quads", "glutes", "abs"]),
            (6, "Rest Day", None), (7, "Rest Day", None),
        ]
    if days_per_week == 4:
        return [
            (1, "Upper Body", ["pectorals", "lats", "delts", "biceps", "triceps", "abs"]),
            (2, "Lower Body", ["quads", "hamstrings", "glutes", "calves"]),
            (3, "Rest Day", None),
            (4, "Upper Body", ["pectorals", "lats", "delts", "biceps", "triceps", "abs"]),
            (5, "Lower Body", ["quads", "hamstrings", "glutes", "calves"]),
            (6, "Rest Day", None), (7, "Rest Day", None),
        ]
    if days_per_week == 5:
        return [
            (1, "Push", ["pectorals", "delts", "triceps"]),
            (2, "Pull", ["lats", "traps", "biceps"]),
            (3, "Legs", ["quads", "hamstrings", "glutes", "calves"]),
            (4, "Rest Day", None),
            (5, "Upper Body", ["pectorals", "lats", "delts", "biceps", "triceps"]),
            (6, "Lower Body", ["quads", "hamstrings", "glutes", "calves"]),
            (7, "Rest Day", None),
        ]
    # 6+ days
    return [
        (1, "Push", ["pectorals", "delts", "triceps"]),
        (2, "Pull", ["lats", "traps", "biceps"]),
        (3, "Legs", ["quads", "hamstrings", "glutes", "calves"]),
        (4, "Push", ["pectorals", "delts", "triceps"]),
        (5, "Pull", ["lats", "traps", "biceps"]),
        (6, "Legs", ["quads", "hamstrings", "glutes", "calves"]),
        (7, "Rest Day", None),
    ]


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


def _select_exercises_for_day(
    focus_muscles, lagging_muscles, user_equipment, all_exclusions,
    used_exercise_ids, experience_level, target_total=5
):
    """
    Select exercises for one day, prioritizing lagging muscles.
    
    Strategy:
    1. Filter by focus_muscles (must hit at least one)
    2. Filter by equipment
    3. Filter out exclusions
    4. Prioritize exercises that hit lagging_muscles
    5. Use difficulty_level if populated (future-proof)
    """
    candidates = Exercise.objects.filter(
        is_active=True,
        target_muscles__overlap=focus_muscles,  # must hit at least one focus muscle
    ).exclude(id__in=used_exercise_ids)

    # Filter by equipment
    valid_candidates = [
        ex for ex in candidates
        if set(ex.equipments).issubset(user_equipment)
    ]

    # Filter out exclusions (safety + AI + injury-based)
    if all_exclusions:
        valid_candidates = [
            ex for ex in valid_candidates
            if not any(
                excl.lower() in " ".join(ex.target_muscles + ex.secondary_muscles + ex.body_parts).lower()
                for excl in all_exclusions
            )
        ]

    # Use difficulty_level if populated (future-proof)
    max_diff = EXPERIENCE_MAX_DIFF.get(experience_level, 3)
    if any(ex.difficulty_level is not None for ex in valid_candidates):
        valid_candidates = [
            ex for ex in valid_candidates
            if ex.difficulty_level is None or ex.difficulty_level <= max_diff
        ]

    # Partition into priority (hits lagging) and others
    lagging_set = set(lagging_muscles)
    priority = [ex for ex in valid_candidates if set(ex.target_muscles) & lagging_set]
    others = [ex for ex in valid_candidates if not (set(ex.target_muscles) & lagging_set)]

    # Select with priority bias
    selected = []
    for pool in [priority, others]:
        if len(selected) >= target_total:
            break
        random.shuffle(pool)
        while pool and len(selected) < target_total:
            ex = pool.pop(0)
            new_muscles = set(ex.target_muscles) & set(focus_muscles) - {
                m for sel in selected for m in sel.target_muscles
            }
            if new_muscles or len(selected) == 0:
                selected.append(ex)

    used_exercise_ids.update(ex.id for ex in selected)
    return selected


def _adjust_prescription(base_prescription, modifier, experience_level):
    exp_set_adj = EXPERIENCE_SET_ADJ.get(experience_level, 0)
    exp_rest_adj = EXPERIENCE_REST_ADJ.get(experience_level, 0)

    sets = base_prescription["sets"] + modifier + exp_set_adj
    sets = max(2, min(sets, 5))

    rest = base_prescription["rest_seconds"] - (modifier * 10) + exp_rest_adj
    rest = max(15, min(rest, 120))

    return {
        "sets": sets,
        "reps": base_prescription["reps"],
        "rest_seconds": rest,
    }


@transaction.atomic
def generate_workout_plan(user, reason="initial", intensity_modifier=0,
                          extra_exclusions=None, adjustment_note=None, physique=None):
    try:
        profile = user.onboarding_profile
    except OnboardingProfile.DoesNotExist:
        raise ValueError("User has not completed onboarding yet.")

    if physique is None:
        physique = user.physique_profiles.filter(is_current=True).first()
    
    lagging_muscles = list(physique.lagging_muscles) if physique else []
    experience_level = getattr(profile, "experience_level", "beginner")

    safety_exclusions = get_safety_exclusions(profile)

    if extra_exclusions:
        safety_exclusions.extend(extra_exclusions)

    ai_exclusions = getattr(profile, "ai_exclusions", [])

    all_exclusions = list(set(safety_exclusions + ai_exclusions))

    user_equipment = _get_user_equipment_values(profile)
    template = generate_weekly_template(profile.days_per_week, profile.workout_focus)
    base_prescription = GOAL_PRESCRIPTION.get(profile.primary_goal, GOAL_PRESCRIPTION["general_fitness"])
    prescription = _adjust_prescription(base_prescription, intensity_modifier, experience_level)

    # Deactivate previous plans
    WorkoutPlan.objects.filter(user=user, is_active=True).update(is_active=False)

    plan = WorkoutPlan.objects.create(
        user=user,
        physique_profile=physique,
        is_active=True,
        generated_reason=reason,
        adjustment_note=adjustment_note,
    )

    used_exercise_ids = set()

    for day_number, label, focus_muscles in template:
        is_rest = focus_muscles is None
        workout_day = WorkoutDay.objects.create(
            plan=plan,
            day_number=day_number,
            label=label,
            is_rest_day=is_rest,
            focus_muscles=focus_muscles if not is_rest else [],
            estimated_duration_minutes=profile.time_per_session if not is_rest else None,
        )

        if is_rest:
            continue

        exercises = _select_exercises_for_day(
            focus_muscles, lagging_muscles, user_equipment, all_exclusions,
            used_exercise_ids, experience_level, target_total=5
        )

        for order, exercise in enumerate(exercises, start=1):
            is_priority = bool(set(exercise.target_muscles) & set(lagging_muscles))
            WorkoutExercise.objects.create(
                workout_day=workout_day,
                exercise=exercise,
                order=order,
                sets=prescription["sets"],
                reps=prescription["reps"],
                rest_seconds=prescription["rest_seconds"],
                is_priority=is_priority,
                reason=f"Targets lagging {', '.join(set(exercise.target_muscles) & set(lagging_muscles))}"
                if is_priority else "",
            )

    return plan


def regenerate_plan_with_progression(user, reason="ai_adjustment"):
    """Analyze progression and regenerate with adjustments."""
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
    """Replace exercises matching a keyword with valid alternatives."""
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

    workout_exercises = WorkoutExercise.objects.filter(
        workout_day__plan=plan, 
        exercise__name__icontains=keyword
    )

    replaced_count = 0
    current_exercise_ids = set(WorkoutExercise.objects.filter(workout_day__plan=plan).values_list('exercise_id', flat=True))

    for we in workout_exercises:
        original_ex = we.exercise

        if not original_ex.body_parts:
            continue
            
        candidates = Exercise.objects.filter(
            is_active=True,
            body_parts__overlap=original_ex.body_parts,
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
            new_ex = random.choice(valid_candidates)
            we.exercise = new_ex
            we.save()
            
            current_exercise_ids.add(new_ex.id)
            replaced_count += 1

    return replaced_count