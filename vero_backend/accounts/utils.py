import uuid

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone


def send_verification_email(user):
    user.email_verification_token = str(uuid.uuid4())
    user.email_verification_sent_at = timezone.now()
    user.save(update_fields=["email_verification_token", "email_verification_sent_at"])

    verification_link = (
        f"{settings.FRONTEND_URL}/verify-email"
        f"?token={user.email_verification_token}"
    )

    send_mail(
        subject="Verify your Vero account",
        message=(
            f"Hi {user.first_name or user.username},\n\n"
            f"Welcome to Vero. Please verify your email by clicking the link below:\n"
            f"{verification_link}\n\n"
            f"This link expires in 24 hours.\n\n"
            f"If you didn't create a Vero account, you can safely ignore this email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )