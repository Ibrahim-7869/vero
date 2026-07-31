from django.contrib import admin
from .models import Exercise


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("name", "body_parts", "equipments", "is_home_friendly")
    list_filter = ("is_home_friendly",)
    search_fields = ("name",)