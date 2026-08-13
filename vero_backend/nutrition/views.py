from datetime import date as date_type

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FoodItem, MealPlan, DailyFoodLog, Meal, DailyFoodLog, MealCompletion
from .serializers import (MealPlanSerializer, FoodItemSerializer, DailyFoodLogSerializer)
from .services import generate_meal_plan, meal_plan_totals


class MealPlanGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        days = int(request.data.get("days", 7))
        include_cheat = bool(request.data.get("include_cheat_day", True))
        plan = generate_meal_plan(request.user, days=days, include_cheat_day=include_cheat)
        return Response(MealPlanSerializer(plan).data, status=status.HTTP_201_CREATED)


class MealPlanActiveView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plan = MealPlan.objects.filter(user=request.user, is_active=True).first()
        if not plan:
            return Response({"error": "No active meal plan."}, status=status.HTTP_404_NOT_FOUND)
        data = MealPlanSerializer(plan).data
        data["actual_totals"] = meal_plan_totals(plan)
        return Response(data)


class FoodSearchView(APIView):
    """Search the FULL food DB (USDA + curated) for logging."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        qs = FoodItem.objects.filter(is_active=True)
        if q:
            qs = qs.filter(name__icontains=q)
        return Response(FoodItemSerializer(qs[:20], many=True).data)


class LogFoodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        food = FoodItem.objects.filter(id=request.data.get("food_item")).first()
        if not food:
            return Response({"error": "Food not found."}, status=status.HTTP_404_NOT_FOUND)
        log = DailyFoodLog.objects.create(
            user=request.user,
            food_item=food,
            quantity=float(request.data.get("quantity", 1)),
            meal_type=request.data.get("meal_type", "snack"),
            date=request.data.get("date") or date_type.today(),
        )
        return Response(DailyFoodLogSerializer(log).data, status=status.HTTP_201_CREATED)


class DailyTotalsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        d = request.query_params.get("date") or date_type.today()
        comps = MealCompletion.objects.filter(user=request.user, date=d)
        totals = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
        for comp in comps:
            for mf in comp.meal.foods.all():
                q = float(mf.quantity); f = mf.food_item
                totals["calories"] += float(f.calories) * q
                totals["protein"] += float(f.protein_g) * q
                totals["carbs"] += float(f.carbs_g) * q
                totals["fats"] += float(f.fats_g) * q
        plan = MealPlan.objects.filter(user=request.user, is_active=True).first()
        return Response({
            "date": str(d),
            "totals": {k: round(v, 1) for k, v in totals.items()},
            "completed_meal_ids": [c.meal_id for c in comps],
            "targets": {
                "calories": plan.target_calories, "protein": plan.target_protein_g,
                "carbs": plan.target_carbs_g, "fats": plan.target_fats_g,
            } if plan else None,
        })
            
class CompleteMealView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        meal = Meal.objects.filter(meal_plan__user=request.user, id=request.data.get("meal_id")).first()
        if not meal:
            return Response({"error": "Meal not found."}, status=status.HTTP_404_NOT_FOUND)
        d = request.data.get("date") or date_type.today()
        MealCompletion.objects.get_or_create(user=request.user, meal=meal, date=d)
        return Response({"completed": True, "meal_id": meal.id, "date": str(d)}, status=status.HTTP_201_CREATED)


