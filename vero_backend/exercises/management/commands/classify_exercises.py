from django.core.management.base import BaseCommand
from django.db.models import Q

from exercises.models import Exercise
from exercises.services import classify  # ← updated import


class Command(BaseCommand):
    help = "Classify difficulty_level + movement_pattern using rule-based heuristics."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=0, help="0 = all unlabeled")
        parser.add_argument("--force", action="store_true", help="re-label everything")

    def handle(self, *args, **options):
        if options["force"]:
            qs = Exercise.objects.filter(is_active=True)
        else:
            qs = Exercise.objects.filter(is_active=True).filter(
                Q(difficulty_level__isnull=True)
                | Q(movement_pattern__isnull=True)
                | Q(movement_pattern="")
            )

        if options["limit"]:
            qs = qs[: options["limit"]]

        ok = 0
        for ex in qs:
            labels = classify(ex)
            ex.difficulty_level = labels["difficulty_level"]
            ex.movement_pattern = labels["movement_pattern"]
            ex.save(update_fields=["difficulty_level", "movement_pattern"])
            ok += 1
            if options.get("verbosity", 1) > 1:
                self.stdout.write(
                    f"  {ex.name} -> d{labels['difficulty_level']} / {labels['movement_pattern']}"
                )

        self.stdout.write(self.style.SUCCESS(f"Classified {ok} exercises."))