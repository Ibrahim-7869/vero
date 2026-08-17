from rest_framework import serializers
from .models import Injury, InjuryCheckIn


class InjuryCheckInSerializer(serializers.ModelSerializer):
    injury_body_part = serializers.CharField(source="injury.body_part")

    class Meta:
        model = InjuryCheckIn
        fields = ["id", "scheduled_date", "status", "user_response", "pain_level", "injury_body_part"]


class InjurySerializer(serializers.ModelSerializer):
    check_ins = InjuryCheckInSerializer(many=True, read_only=True)

    class Meta:
        model = Injury
        fields = ["id", "body_part", "description", "severity", "rest_period_days",
                  "rest_period_source", "reported_at", "recovery_start_date",
                  "expected_recovery_date", "status", "is_active", "check_ins"]