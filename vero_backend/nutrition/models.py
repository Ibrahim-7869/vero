from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models


class FoodItem(models.Model):
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=255, blank=True)
    serving_size = models.CharField(max_length=100)
    serving_grams = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    calories = models.DecimalField(max_digits=7, decimal_places=1, default=0)
    protein_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    carbs_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    fats_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    fiber_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    sugar_g = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    category = models.CharField(max_length=100, blank=True)
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    contains_pork = models.BooleanField(default=False)
    contains_alcohol = models.BooleanField(default=False)
    contains_shellfish = models.BooleanField(default=False)
    cuisine_tags = ArrayField(models.CharField(max_length=30), default=list, blank=True)
    tags = ArrayField(models.CharField(max_length=100), default=list)
    external_id = models.CharField(max_length=100, blank=True)
    is_common = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class MealPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="meal_plans")
    physique_profile = models.ForeignKey(
        "onboarding.PhysiqueProfile", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="meal_plans"
    )
    name = models.CharField(max_length=255)
    goal = models.CharField(max_length=50)
    target_calories = models.DecimalField(max_digits=6, decimal_places=0)
    target_protein_g = models.DecimalField(max_digits=6, decimal_places=0)
    target_carbs_g = models.DecimalField(max_digits=6, decimal_places=0)
    target_fats_g = models.DecimalField(max_digits=6, decimal_places=0)
    days_per_week = models.PositiveIntegerField(default=7)
    has_cheat_day = models.BooleanField(default=False)
    cheat_day_number = models.PositiveSmallIntegerField(null=True, blank=True)
    cheat_day_calories = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_generated_by_ai = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.email})"


class Meal(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = "breakfast", "Breakfast"
        LUNCH = "lunch", "Lunch"
        DINNER = "dinner", "Dinner"
        SNACK = "snack", "Snack"
        PRE_WORKOUT = "pre_workout", "Pre-Workout"
        POST_WORKOUT = "post_workout", "Post-Workout"

    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name="meals")
    day_number = models.PositiveIntegerField()
    meal_type = models.CharField(max_length=20, choices=MealType.choices)
    name = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["day_number", "meal_type"]

    def __str__(self):
        return f"Day {self.day_number} - {self.meal_type}"


class MealFood(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name="foods")
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name="meal_entries")
    quantity = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    preparation_notes = models.TextField(blank=True)

    class Meta:
        unique_together = ["meal", "food_item"]


class DailyFoodLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="food_logs")
    date = models.DateField()
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name="daily_logs")
    meal_type = models.CharField(max_length=20, choices=Meal.MealType.choices)
    quantity = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-logged_at"]
        
class MealCompletion(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="meal_completions")
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name="completions")
    date = models.DateField()
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "meal", "date")   # once per day