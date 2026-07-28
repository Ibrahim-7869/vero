import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=250, blank=True, null=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def is_verification_token_expired(self):
        if not self.email_verification_sent_at:
            return True
        return timezone.now() > self.email_verification_sent_at + timezone.timedelta(hours=24)

    def __str__(self):
        return self.email