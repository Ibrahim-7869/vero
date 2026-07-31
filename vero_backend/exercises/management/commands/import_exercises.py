import time
import requests
from django.core.management.base import BaseCommand
from exercises.models import Exercise

HOME_EQUIPMENT = {"body weight", "dumbbell", "band", "resistance band", "kettlebell"}
API_BASE = "https://oss.exercisedb.dev/api/v1/exercises"


class Command(BaseCommand):
    help = "Fetches all exercises from the ExerciseDB free API and stores them locally."

    def handle(self, *args, **options):
        cursor = None
        total_imported = 0

        while True:
            params = {"after": cursor} if cursor else {}
            self.stdout.write(f"Fetching batch (cursor={cursor})...")

            response = self._get_with_retry(params)
            payload = response.json()

            exercises = payload.get("data", [])
            meta = payload.get("meta", {})

            for item in exercises:
                equipments = item.get("equipments", [])
                is_home_friendly = bool(equipments) and all(
                    eq.lower().strip() in HOME_EQUIPMENT for eq in equipments
                )

                Exercise.objects.update_or_create(
                    external_id=item["exerciseId"],
                    defaults={
                        "name": item.get("name", ""),
                        "gif_url": item.get("gifUrl", ""),
                        "body_parts": item.get("bodyParts", []),
                        "equipments": equipments,
                        "target_muscles": item.get("targetMuscles", []),
                        "secondary_muscles": item.get("secondaryMuscles", []),
                        "instructions": item.get("instructions", []),
                        "is_home_friendly": is_home_friendly,
                    },
                )
                total_imported += 1

            if not meta.get("hasNextPage"):
                break
            new_cursor = meta.get("nextCursor")
            if not new_cursor or new_cursor == cursor:
                self.stdout.write(self.style.WARNING("Cursor did not advance. Stopping."))
                break
            cursor = new_cursor

            # Be polite to the free API — pause between requests
            time.sleep(1)

        home_friendly_count = Exercise.objects.filter(is_home_friendly=True).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Imported {total_imported} exercises total, "
                f"{home_friendly_count} marked as home-friendly."
            )
        )

    def _get_with_retry(self, params, max_retries=5):
        """Fetch with exponential backoff if we hit a 429 rate limit."""
        for attempt in range(max_retries):
            response = requests.get(API_BASE, params=params)
            if response.status_code == 429:
                wait = int(response.headers.get("Retry-After", 5)) * (attempt + 1)
                self.stdout.write(self.style.WARNING(f"Rate limited. Waiting {wait}s..."))
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response
        raise Exception("Max retries exceeded due to repeated rate limiting.")