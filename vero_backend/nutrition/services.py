from onboarding.services.biometrics import calculate_biometrics
from .models import FoodItem, MealPlan, Meal, MealFood

# Category pools per meal
MEAL_POOLS = {
    "breakfast": ["protein", "carb", "dairy", "fruit"],
    "lunch": ["protein", "carb", "vegetable"],
    "dinner": ["protein", "carb", "vegetable"],
    "snack": ["protein", "fat", "fruit", "dairy"],
}

COMMON_FOOD_KEYWORDS = [
    "chicken", "rice", "egg", "oats", "bread", "milk", "banana", "apple",
    "potato", "sweet potato", "pasta", "beef", "salmon", "tuna", "yogurt",
    "cheese", "almonds", "peanut", "olive oil", "avocado", "broccoli",
    "spinach", "carrot", "lentil", "chickpea", "tofu", "shrimp", "turkey",
    "quinoa", "roti", "chapati", "daal", "paneer", "cottage", "whey",
]

NOT_COMMON_KEYWORDS = [
    "variety meats", "by-products", "lungs", "kidneys", "spleen", "heart",
    "tripe", "brains", "alaska native", "herring", "kippered", "jellied",
    "luncheon", "fast food", "kfc", "fried chicken", "infant", "baby",
    "game", "venison", "moose", "seal", "whale", "bear",
]

PLATE_STRUCTURE = {
    "breakfast": [("protein", 0.25, 2.0), ("carb", 0.40, 3.0), ("fruit", 0.20, 2.0), ("dairy", 0.15, 2.0)],
    "lunch":     [("protein", 0.40, 2.0), ("carb", 0.35, 3.0), ("vegetable", 0.20, 2.0)],
    "dinner":    [("protein", 0.40, 2.0), ("carb", 0.35, 3.0), ("vegetable", 0.20, 2.0)],
    "snack":     [("fruit", 0.50, 2.0), ("dairy", 0.30, 2.0), ("fat", 0.20, 1.5)],
}

BREAKFAST_KEYWORDS = ["egg", "oat", "bread", "roti", "paratha", "naan", "yogurt",
                      "milk", "banana", "fruit", "pancake", "dosa", "idli", "halwa", "poha"]

def infer_is_common(name):
    n = (name or "").lower()
    if any(k in n for k in NOT_COMMON_KEYWORDS):
        return False
    return any(k in n for k in COMMON_FOOD_KEYWORDS)

def infer_diet_flags(name, category):
    n = (name or "").lower()
    contains_pork = any(w in n for w in ["pork","bacon","prosciutto","pancetta","gammon","ham"])
    contains_alcohol = any(w in n for w in ["wine","beer","liquor","vodka","rum "])
    contains_shellfish = any(w in n for w in ["shrimp","prawn","crab","lobster","oyster","clam","shellfish"])
    plant_protein = any(w in n for w in ["tofu","tempeh","lentil","bean","chickpea","seitan","dal"])
    is_meat_or_fish = (category == "protein") and not plant_protein
    is_dairy_or_egg = (category == "dairy") or "egg" in n or "honey" in n
    return {
        "is_vegetarian": not is_meat_or_fish,
        "is_vegan": (not is_meat_or_fish) and not is_dairy_or_egg,
        "contains_pork": contains_pork,
        "contains_alcohol": contains_alcohol,
        "contains_shellfish": contains_shellfish,
    }

def apply_diet_filters(qs, restriction):
    if restriction == "vegetarian":
        return qs.filter(is_vegetarian=True)
    if restriction == "vegan":
        return qs.filter(is_vegan=True)
    if restriction in ("halal", "kosher"):
        qs = qs.exclude(contains_pork=True).exclude(contains_alcohol=True)
    if restriction == "kosher":
        qs = qs.exclude(contains_shellfish=True)
    return qs

def _get_targets(user, physique):
    if physique is not None and physique.target_calories:
        raw = {
            "calories": float(physique.target_calories),
            "protein": float(physique.target_protein_g),
            "carbs": float(physique.target_carbs_g),
            "fats": float(physique.target_fats_g),
        }
    else:
        bio = calculate_biometrics(user.onboarding_profile)
        raw = {
            "calories": bio.target_calories,
            "protein": bio.target_protein_g,
            "carbs": bio.target_carbs_g,
            "fats": bio.target_fats_g,
        }
    return {
        "calories": max(raw["calories"], 1200),
        "protein": max(raw["protein"], 0),
        "carbs": max(raw["carbs"], 0),
        "fats": max(raw["fats"], 0),
    }

def _sort_key(cuisine):
    def key(f):
        density = float(f.protein_g) / max(float(f.calories), 1)
        hit = 0 if (cuisine and cuisine in (f.cuisine_tags or [])) else 1
        clean = 0 if "," not in (f.name or "") else 1
        return (hit, clean, -density)
    return key

def _breakfast_key(cuisine):
    def key(f):
        n = (f.name or "").lower()
        hit = 0 if (cuisine and cuisine in (f.cuisine_tags or [])) else 1
        bf = 0 if any(k in n for k in BREAKFAST_KEYWORDS) else 1
        clean = 0 if "," not in (f.name or "") else 1
        return (hit, bf, clean, -float(f.protein_g) / max(float(f.calories), 1))
    return key

def _pick_foods(meal_cal, categories, restriction, cuisine, used_ids, meal_type=None, max_serv=1.5):
    base = FoodItem.objects.filter(is_active=True, is_common=True, category__in=categories)
    base = apply_diet_filters(base, restriction)

    def do_pick(qs):
        qs = qs.exclude(id__in=used_ids)
        key = _breakfast_key(cuisine) if meal_type == "breakfast" else _sort_key(cuisine)
        foods = sorted(list(qs), key=key)
        picks, remaining = [], meal_cal
        for food in foods:
            if remaining <= 60 or len(picks) >= 4:
                break
            cal = float(food.calories) or 1
            serv = min(remaining / cal, max_serv)
            if serv < 0.5:
                continue
            serv = round(serv * 2) / 2
            picks.append((food, serv))
            remaining -= serv * cal
        return picks, remaining

    if cuisine:
        picks, remaining = do_pick(base.filter(cuisine_tags__contains=[cuisine]))
        if remaining > meal_cal * 0.4:
            extra, _ = do_pick(base)
            have = {f.id for f, _ in picks}
            for f, s in extra:
                if f.id not in have:
                    picks.append((f, s))
                    have.add(f.id)
    else:
        picks, _ = do_pick(base)

    if not picks and used_ids:
        return _pick_foods(meal_cal, categories, restriction, cuisine, set(), meal_type, max_serv)
    return picks

def _fill_meal(meal, meal_type, meal_cal, restriction, cuisine, used_ids):
    for category, frac, max_serv in PLATE_STRUCTURE.get(meal_type, PLATE_STRUCTURE["lunch"]):
        food = _best_food(category, restriction, cuisine, used_ids, meal_type)
        if not food:
            continue
        cal = float(food.calories) or 1
        serv = min(max((meal_cal * frac) / cal, 0.5), max_serv)
        serv = round(serv * 2) / 2
        MealFood.objects.create(meal=meal, food_item=food, quantity=serv)
        used_ids.add(food.id)

def generate_meal_plan(user, physique=None, days=7, include_cheat_day=True):
    profile = user.onboarding_profile
    restriction = getattr(profile, "dietary_restriction", "none") or "none"
    cuisine = getattr(profile, "cuisine_preference", "") or ""

    if physique is None:
        physique = user.physique_profiles.filter(is_current=True).first()
    
    # CRITICAL: This line MUST be indented 4 spaces (same level as 'if physique is None:').
    # DO NOT put this inside the 'if' block above!
    targets = _get_targets(user, physique)

    tdee = float(physique.tdee) if (physique and physique.tdee) else targets["calories"]
    cheat_day = days if (include_cheat_day and days >= 6) else None

    user.meal_plans.filter(is_active=True).update(is_active=False)
    plan = MealPlan.objects.create(
        user=user, physique_profile=physique, name="Weekly Meal Plan",
        goal=profile.primary_goal,
        target_calories=round(targets["calories"]),
        target_protein_g=round(targets["protein"]),
        target_carbs_g=round(targets["carbs"]),
        target_fats_g=round(targets["fats"]),
        days_per_week=days, is_active=True,
        has_cheat_day=cheat_day is not None,
        cheat_day_number=cheat_day,
        cheat_day_calories=round(tdee) if cheat_day else None,
    )

    used_week = set()
    for day in range(1, days + 1):
        if day == cheat_day:
            continue
        for mt, frac in (("breakfast", 0.25), ("lunch", 0.30), ("dinner", 0.30), ("snack", 0.15)):
            m = Meal.objects.create(meal_plan=plan, day_number=day, meal_type=mt)
            _fill_meal(m, mt, targets["calories"] * frac, restriction, cuisine, used_week)

    return plan


def meal_plan_totals(plan):
    totals = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
    for meal in plan.meals.all():
        for mf in meal.foods.all():
            f = mf.food_item
            q = float(mf.quantity)
            totals["calories"] += float(f.calories) * q
            totals["protein"] += float(f.protein_g) * q
            totals["carbs"] += float(f.carbs_g) * q
            totals["fats"] += float(f.fats_g) * q
    return {k: round(v, 1) for k, v in totals.items()}

def _best_food(category, restriction, cuisine, used_ids, meal_type=None):
    qs = FoodItem.objects.filter(is_active=True, is_common=True, category=category)
    qs = apply_diet_filters(qs, restriction)
    key = _breakfast_key(cuisine) if meal_type == "breakfast" else _sort_key(cuisine)
    fresh = sorted(list(qs.exclude(id__in=used_ids)), key=key)
    if fresh:
        return fresh[0]
    reused = sorted(list(qs), key=key)
    return reused[0] if reused else None