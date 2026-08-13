import json, os, glob
from django.core.management.base import BaseCommand
from nutrition.models import FoodItem, MealPlan, DailyFoodLog


def clean(obj):
    if isinstance(obj, dict):
        return {str(k).strip(): clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean(x) for x in obj]
    if isinstance(obj, str):
        return obj.strip()
    return obj


class Command(BaseCommand):
    help = "Delete old FoodItems not present in the curated JSON files (data/)."

    def add_arguments(self, parser):
        parser.add_argument("--dir", default="data")

    def handle(self, *args, **o):
        # 1. Build the keep-set from every curated JSON in data/
        keep = set()
        for path in glob.glob(os.path.join(o["dir"], "*.json")):
            with open(path, encoding="utf-8") as f:
                data = clean(json.loads(f.read().strip()))
            for d in data:
                if isinstance(d, dict) and d.get("name"):
                    keep.add(d["name"].lower())

        # 2. Never delete a food a user has actually logged
        logged = set(DailyFoodLog.objects.values_list("food_item__name", flat=True))
        keep |= {n.lower() for n in logged if n}

        # 3. Wipe old meal plans (they reference old foods; regenerate after)
        plans_deleted, _ = MealPlan.objects.all().delete()

        # 4. Delete every food NOT in the keep-set
        to_delete = [f.id for f in FoodItem.objects.all() if f.name.lower() not in keep]
        deleted, _ = FoodItem.objects.filter(id__in=to_delete).delete()

        self.stdout.write(self.style.SUCCESS(
            f"Done. Kept {FoodItem.objects.count()} curated foods | "
            f"deleted {deleted} old foods | removed {plans_deleted} meal-plan rows."
        ))