from django.test import TestCase
from onboarding.services.biometrics import (
    calculate_bmi, calculate_bmr, calculate_tdee, adjust_calories_for_goal,
)

class BiometricsTestCase(TestCase):
    def test_bmi(self):
        self.assertAlmostEqual(calculate_bmi(80, 180), 24.7, places=1)

    def test_bmr_male(self):
        # (10*80) + (6.25*180) - (5*25) + 5 = 1805
        self.assertEqual(calculate_bmr(80, 180, 25, "male"), 1805)

    def test_bmr_female(self):
        # (10*60) + (6.25*165) - (5*30) - 161 = 1320
        self.assertEqual(calculate_bmr(60, 165, 30, "female"), 1320)

    def test_tdee_moderate_activity(self):
        # 4 days/week -> 1.55 multiplier
        self.assertEqual(calculate_tdee(1805, 4), round(1805 * 1.55))

    def test_calorie_floor_never_below_bmr(self):
        # Huge deficit should still not drop below BMR
        result = adjust_calories_for_goal(tdee=1600, goal="lose_weight", bmr=1700)
        self.assertEqual(result, 1700)