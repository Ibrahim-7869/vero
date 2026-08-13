from django.urls import path
from .views import (MealPlanGenerateView, MealPlanActiveView, FoodSearchView,
                    LogFoodView, DailyTotalsView, CompleteMealView)

urlpatterns = [
    path("plan/generate/", MealPlanGenerateView.as_view(), name="meal-generate"),
    path("plan/active/", MealPlanActiveView.as_view(), name="meal-active"),
    path("foods/search/", FoodSearchView.as_view(), name="food-search"),
    path("log/", LogFoodView.as_view(), name="food-log"),
    path("totals/", DailyTotalsView.as_view(), name="daily-totals"),
        path("complete/", CompleteMealView.as_view(), name="meal-complete"),
]