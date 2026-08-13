import json
from django.core.management.base import BaseCommand
from nutrition.models import FoodItem

CATS = ["protein", "carb", "fat", "vegetable", "dairy", "fruit"]

def clean(obj):
    if isinstance(obj, dict):
        return {str(k).strip(): clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean(x) for x in obj]
    if isinstance(obj, str):
        return obj.strip()
    return obj

class Command(BaseCommand):
    help = "Load healthy cuisine foods from an LLM-generated JSON file."

    def add_arguments(self, parser):
        parser.add_argument("--file", required=True)
        parser.add_argument("--cuisine", required=True)

    def handle(self, *args, **o):
        cuisine = o["cuisine"].strip().lower()
        with open(o["file"], "r", encoding="utf-8") as f:
            text = f.read().strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
        data = clean(json.loads(text))
        if isinstance(data, dict):
            data = data.get("dishes") or data.get("foods") or []

        added = 0
        for d in data:
            cat = d.get("category") if d.get("category") in CATS else "carb"
            name = d.get("name")
            if not name:
                continue
            try:
                cal = float(d["calories"]); p = float(d["protein_g"])
                c = float(d["carbs_g"]); fa = float(d["fats_g"])
            except Exception:
                continue

            existing = FoodItem.objects.filter(name__iexact=name).first()
            if existing:
                tags = set(existing.cuisine_tags or [])
                tags.add(cuisine)
                existing.cuisine_tags = list(tags)
                existing.is_common = True
                existing.save()
            else:
                FoodItem.objects.create(
                    name=name, serving_size=d.get("serving_size", "1 serving"),
                    calories=round(cal, 1), protein_g=round(p, 1),
                    carbs_g=round(c, 1), fats_g=round(fa, 1),
                    category=cat, cuisine_tags=[cuisine],
                    is_common=True, is_active=True,
                    is_vegetarian=bool(d.get("is_vegetarian")),
                    is_vegan=bool(d.get("is_vegan")),
                    contains_pork=bool(d.get("contains_pork")),
                    contains_alcohol=bool(d.get("contains_alcohol")),
                    contains_shellfish=bool(d.get("contains_shellfish")),
                )
            added += 1
        self.stdout.write(self.style.SUCCESS(f"{cuisine}: loaded {added} foods"))