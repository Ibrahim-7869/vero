from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.conf import settings

# Create your models here.
class InjuryTypeTemplate(models.Model):
    body_part = models.CharField(max_length=50, unique=True)
    mild_days = models.PositiveIntegerField()
    moderate_days = models.PositiveIntegerField()
    severe_days = models.PositiveIntegerField()
    avoid_exercises_tagged = ArrayField(models.CharField(max_length=100), default=list)
    
    def __str__(self):
        return self.body_part
    
    def rest_day_for(self, severity):
        return {
            "mild": self.mild_days,
            "moderate": self.moderate_days,
            "severe": self.severe_days,
        }.get(severity, self.moderate_days)
        
class Injury(models.Model):
    class BodyPart(models.TextChoices):
        KNEE = "knee", "Knee"
        SHOULDER = "shoulder", "Shoulder"
        LOWER_BACK = "lower_back", "Lower Back"
        ANKLE = "ankle", "Ankle"
        WRIST = "wrist", "Wrist"
        NECK = "neck", "Neck"
        ELBOW = "elbow", "Elbow"
        HIP = "hip", "Hip"
        OTHER = "other", "Other"
        
    class Severity(models.TextChoices):
        MILD = "mild", "Mild"
        MODERATE = "moderate", "Moderate"
        SEVERE = "severe", "Severe"
        
    class RestSource(models.TextChoices):
        DOCTOR = "doctor_provided", "Doctor Provided"
        SYSTEM = "system_calculated", "System Calculated"
        
    class Status(models.TextChoices):
        ACTIVE_RECOVERY = "active_recovery", "Active Recovery"
        CHECK_IN_PENDING = "check_in_pending", "Check-in Pending"
        RECOVERED = "recovered", "Recovered"
        RECURRING = "recurring", "Recurring"
        
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="injuries"
    )
    body_part = models.CharField(max_length=30, choices=BodyPart.choices)
    description = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=Severity.choices)
    rest_period_days = models.PositiveIntegerField()
    rest_period_source = models.CharField(max_length=20, choices=RestSource.choices)
    reported_at = models.DateTimeField(auto_now_add=True)
    recovery_start_date = models.DateField()
    expected_recovery_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE_RECOVERY)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ["-reported_at"]
        
    def __str__(self):
        return f"{self.user.email} - {self.body_part} ({self.severity})"
    
class InjuryCheckIn(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"
        
    class UserResponse(models.TextChoices):
        FULLY_RECOVERED = "fully_recovered", "Fully Recovered"
        PARTIALLY_RECOVERED = "partially_recovered", "Partially Recovered"
        SAME = "same", "Same"
        WORSE = "worse", "Worse"
        
    injury = models.ForeignKey(Injury, on_delete=models.CASCADE, related_name="check_ins")
    scheduled_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    user_response = models.CharField(max_length=30, choices=UserResponse.choices, null=True, blank=True)
    pain_level = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Check-in for {self.injury.body_part} on {self.scheduled_date}"
    