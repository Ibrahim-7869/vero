from dataclasses import dataclass

GOAL_CALORIE_ADJUSTMENT = {
    "lose_weight": -500,
    "build_muscle": 300,
    "general_fitness":0,
    "tone": -250,
}

GOAL_PROTEIN_PER_KG = {
    "lose_weight": 2.0,
    "build_muscle": 1.8,
    "general_fitness": 1.6,
    "tone": 1.8,
}

FAT_CALORIE_RATIO = 0.25

def _activity_multiplier(days_per_week: int) -> float:
    if days_per_week <= 1:
        return 1.2
    elif days_per_week <= 3:
        return 1.375
    elif days_per_week <= 5:
        return 1.55
    else:
        return 1.725
    
def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    if not weight_kg or not height_cm:
        return 0.0
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)

def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> float:
    base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)
    if gender == "male":
        return round(base + 5, 0)
    elif gender == "female":
        return round(base - 161, 0)
    else:
        return round(base - 78, 0)
    
def calculate_tdee(bmr: float,days_per_week:int) -> float:
    return round(bmr * _activity_multiplier(days_per_week), 0)

def adjust_calories_for_goal(tdee: float, goal: str, bmr: float) -> float:
    adjusted = tdee + GOAL_CALORIE_ADJUSTMENT.get(goal, 0)
    return round(max(adjusted, bmr), 0)

def calculate_macros(weight_kg: float, target_calories: float, goal: str):
    protien_g = round(weight_kg * GOAL_PROTEIN_PER_KG.get(goal, 1.6), 0)
    protien_cal = protien_g * 4
    
    fat_cal = target_calories * FAT_CALORIE_RATIO
    fat_g = round(fat_cal / 9, 0)
    
    carbs_cal = target_calories -protien_cal - fat_cal
    carbs_g = round(max(carbs_cal, 0) / 4, 0)
    
    return protien_g, carbs_g, fat_g

@dataclass
class BiometricResults:
    bmi: float
    bmr: float
    tdee: float
    target_calories: float
    target_protein_g: float
    target_carbs_g: float
    target_fats_g: float
    
def calculate_biometrics(profile) -> BiometricResults:
    weight = float(profile.weight_kg or 0)
    height = float (profile.height_cm or 0)
    age = profile.age or 0
    gender = profile.gender
    goal = profile.primary_goal
    days = profile.days_per_week
    
    bmi = calculate_bmi(weight, height)
    bmr = calculate_bmr(weight, height, age, gender)
    tdee = calculate_tdee(bmr, days)
    target_calories = adjust_calories_for_goal(tdee, goal, bmr)
    protein_g , carbs_g, fat_g =calculate_macros(weight, target_calories, goal)
    
    return BiometricResults(
        bmi=bmi, bmr=bmr, tdee=tdee,
        target_calories=target_calories,
        target_protein_g=protein_g,
        target_carbs_g=carbs_g,
        target_fats_g=fat_g
    )
    