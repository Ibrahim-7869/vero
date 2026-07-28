from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "email_verified",
        "created_at",
        "is_staff",
    )
    list_filter = ("email_verified", "is_staff", "is_active")

    fieldsets = UserAdmin.fieldsets + (
        ("Vero-specific fields", {
            "fields": ("email_verified", "created_at", "email_verification_token", "email_verification_sent_at"),
        }),
    )
    readonly_fields = ("created_at",)


admin.site.register(User, CustomUserAdmin)