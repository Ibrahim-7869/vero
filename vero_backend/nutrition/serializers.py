from rest_framework import serializers
from .models import FoodItem, MealPlan, Meal, MealFood, DailyFoodLog


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = ["id", "name", "serving_size", "calories", "protein_g", "carbs_g",
                  "fats_g", "category", "cuisine_tags", "is_vegetarian", "is_vegan"]


class MealFoodSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="food_item.name", read_only=True)
    serving_size = serializers.CharField(source="food_item.serving_size", read_only=True)
    calories = serializers.FloatField(source="food_item.calories", read_only=True)
    protein_g = serializers.FloatField(source="food_item.protein_g", read_only=True)
    carbs_g = serializers.FloatField(source="food_item.carbs_g", read_only=True)
    fats_g = serializers.FloatField(source="food_item.fats_g", read_only=True)

    class Meta:
        model = MealFood
        fields = ["id", "quantity", "name", "serving_size", "calories",
                  "protein_g", "carbs_g", "fats_g"]


class MealSerializer(serializers.ModelSerializer):
    foods = MealFoodSerializer(many=True, read_only=True)

    class Meta:
        model = Meal
        fields = ["id", "day_number", "meal_type", "foods"]


class MealPlanSerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)

    class Meta:
        model = MealPlan
        fields = ["id", "name", "goal", "target_calories", "target_protein_g",
                  "target_carbs_g", "target_fats_g", "days_per_week",
                  "has_cheat_day", "cheat_day_number", "cheat_day_calories",
                  "is_active", "meals"]


class DailyFoodLogSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="food_item.name", read_only=True)

    class Meta:
        model = DailyFoodLog
        fields = ["id", "date", "meal_type", "quantity", "name"]