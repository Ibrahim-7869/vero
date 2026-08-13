import csv
from collections import Counter

from django.core.management.base import BaseCommand
from exercises.models import Exercise


class Command(BaseCommand):
    help = "Show label distribution + export CSV for manual review."

    def handle(self, *args, **options):
        diff, pat, unlabeled, rows = Counter(), Counter(), 0, []
        for e in Exercise.objects.filter(is_active=True):
            if e.difficulty_level is None or not e.movement_pattern:
                unlabeled += 1
            diff[e.difficulty_level] += 1
            pat[e.movement_pattern or "UNLABELED"] += 1
            rows.append([e.id, e.name, e.difficulty_level, e.movement_pattern,
                         ",".join(e.target_muscles)])

        self.stdout.write("Difficulty distribution:")
        for k in sorted(diff):
            self.stdout.write(f"  {k}: {diff[k]}")
        self.stdout.write("Movement pattern distribution:")
        for k, v in pat.most_common():
            self.stdout.write(f"  {k}: {v}")
        self.stdout.write(f"Unlabeled: {unlabeled}")

        with open("exercise_labels_audit.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "name", "difficulty", "movement_pattern", "target_muscles"])
            w.writerows(rows)
        self.stdout.write(self.style.SUCCESS("Wrote exercise_labels_audit.csv"))