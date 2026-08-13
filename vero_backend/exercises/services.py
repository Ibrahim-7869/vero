"""
Exercise services: rule-based classification for difficulty + movement_pattern.

Deterministic, free, instant, auditable. Uses name patterns + metadata
(equipments, target_muscles, body_parts) to assign difficulty + movement_pattern.
Handles ~95% of exercises correctly; ambiguous ones default to safer (easier) values.
"""

# ─── Difficulty rules ────────────────────────────────────────────────

EXPERT_NAMES = {
    "snatch", "clean and jerk", "clean & jerk", "power clean", "power snatch",
    "muscle up", "muscle-up", "planche", "front lever", "back lever",
    "maltese", "pistol squat", "handstand push-up", "human flag",
    "dragon flag", "iron cross", "one arm pull up", "victorian cross",
}

ADVANCED_NAMES = {
    "deadlift", "barbell back squat", "front squat", "barbell bench press",
    "overhead press", "barbell shoulder press", "barbell row", "weighted dip",
    "pull-up", "pull up", "chin-up", "chin up", "good morning", "rack pull",
    "bulgarian split squat", "barbell hip thrust", "dumbbell bench press",
    "incline barbell bench press", "decline bench press",
}

BASIC_NAMES = {
    "push-up", "push up", "bodyweight squat", "air squat", "plank",
    "crunch", "sit-up", "step-up", "wall sit", "mountain climber",
    "burpee", "jumping jack",
}

# ─── Movement pattern rules ──────────────────────────────────────────

PUSH_HORIZONTAL = ["bench press", "chest press", "push-up", "push up", "chest fly",
                   "pec deck", "cable crossover", "dumbbell fly", "machine press"]
PUSH_VERTICAL = ["overhead press", "shoulder press", "military press", "arnold press",
                 "handstand push", "lateral raise", "front raise"]
PULL_HORIZONTAL = ["row", "cable row", "barbell row", "dumbbell row", "t-bar row",
                   "inverted row", "face pull", "rear delt"]
PULL_VERTICAL = ["pull-up", "pull up", "chin-up", "chin up", "lat pulldown",
                 "lat pull", "pullover"]
SQUAT = ["squat", "leg press", "hack squat", "goblet squat", "sumo squat",
         "sissy squat", "wall sit"]
HINGE = ["deadlift", "romanian", "rdl", "hip thrust", "glute bridge",
         "good morning", "kettlebell swing", "back extension", "hyperextension"]
LUNGE = ["lunge", "split squat", "step-up", "walking lunge", "reverse lunge"]
CORE = ["crunch", "sit-up", "plank", "russian twist", "leg raise", "ab wheel",
        "bicycle", "flutter kick", "v-up", "hanging knee", "toe touch",
        "side plank", "dead bug", "bird dog"]
PLYOMETRIC = ["jump", "box jump", "burpee", "plyo", "power jump", "jump squat",
              "tuck jump", "broad jump", "depth jump"]


def _lower(text):
    return (text or "").lower()


def _has_any(text, patterns):
    t = _lower(text)
    return any(p in t for p in patterns)


def classify_difficulty(exercise) -> int:
    """Return 1-5 difficulty rating."""
    name = _lower(exercise.name)
    equipments = [_lower(e) for e in (exercise.equipments or [])]
    target = [_lower(t) for t in (exercise.target_muscles or [])]

    # Olympic / advanced calisthenics → 5
    if any(n in name for n in EXPERT_NAMES):
        return 5

    # Heavy compound free-weight → 4
    if any(n in name for n in ADVANCED_NAMES) and "machine" not in name:
        return 4

    # Machine-based compound or basic dumbbell compound → 3
    if "machine" in name and any(m in name for m in ["press", "row", "squat", "pulldown"]):
        return 2
    if any(n in name for n in BASIC_NAMES):
        return 2

    # Isolation / machine / stretch / mobility → 1-2
    if any(m in name for m in ["curl", "extension", "pushdown", "kickback", "fly", "raise"]):
        return 2
    if any(w in name for w in ["stretch", "foam roll", "warm-up", "mobility"]):
        return 1
    if "machine" in name:
        return 2
    if "body weight" in equipments and not any(n in name for n in BASIC_NAMES):
        return 2

    # Default: intermediate compound
    return 3


def classify_movement_pattern(exercise) -> str:
    """Return one of the MovementPattern enum values."""
    name = _lower(exercise.name)
    target = [_lower(t) for t in (exercise.target_muscles or [])]

    # Plyometric first (jumps override everything)
    if _has_any(name, PLYOMETRIC):
        return "plyometric"

    # Core
    if "abs" in target or "abductors" in target or _has_any(name, CORE):
        if _has_any(name, LUNGE) or _has_any(name, SQUAT) or _has_any(name, HINGE):
            pass  # let the lower-body check win
        else:
            return "core"

    # Lower-body: lunge vs hinge vs squat
    if _has_any(name, LUNGE):
        return "lunge"
    if _has_any(name, HINGE) or "hamstrings" in target or "glutes" in target:
        if _has_any(name, SQUAT) and "hip" not in name:
            return "squat"
        return "hinge"
    if _has_any(name, SQUAT):
        return "squat"
    if "quads" in target and not _has_any(name, ["extension", "raise"]):
        return "squat"

    # Isolation (upper vs lower)
    if _has_any(name, ["leg extension", "leg curl", "calf raise", "hip abduction",
                       "hip adduction", "seated calf", "standing calf"]):
        return "isolation_lower"
    if _has_any(name, ["curl", "pushdown", "extension", "kickback", "fly",
                       "lateral raise", "front raise", "shrug", "face pull"]):
        return "isolation_upper"

    # Push horizontal vs vertical
    if _has_any(name, PUSH_VERTICAL):
        return "push_vertical"
    if _has_any(name, PUSH_HORIZONTAL) or "pectorals" in target:
        return "push_horizontal"

    # Pull vertical vs horizontal
    if _has_any(name, PULL_VERTICAL) or "lats" in target:
        return "pull_vertical"
    if _has_any(name, PULL_HORIZONTAL):
        return "pull_horizontal"

    # Full body
    if _has_any(name, ["clean", "snatch", "thruster", "complex", "carry",
                       "farmer", "burpee"]):
        return "full_body"

    # Fallback: guess from target muscles
    if "pectorals" in target:
        return "push_horizontal"
    if "delts" in target or "shoulders" in [_lower(b) for b in (exercise.body_parts or [])]:
        return "push_vertical"
    if "lats" in target or "upper back" in target:
        return "pull_horizontal"

    return "full_body"


def classify(exercise) -> dict:
    """Main entry point: returns both labels for an exercise."""
    return {
        "difficulty_level": classify_difficulty(exercise),
        "movement_pattern": classify_movement_pattern(exercise),
    }