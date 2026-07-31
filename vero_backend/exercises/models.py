from django.contrib.postgres.fields import ArrayField
from django.db import models


class Exercise(models.Model):
    external_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    gif_url = models.URLField(blank=True, null=True)

    body_parts = ArrayField(models.CharField(max_length=100), default=list)
    equipments = ArrayField(models.CharField(max_length=100), default=list)
    target_muscles = ArrayField(models.CharField(max_length=100), default=list)
    secondary_muscles = ArrayField(models.CharField(max_length=100), default=list, blank=True)

    instructions = models.JSONField(default=list)

    is_home_friendly = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name