import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";
import { submitOnboarding, createPhysiqueFromTemplate } from "../../api/onboarding";
import { generateMealPlan } from "../../api/nutrition";
import { generatePlan } from "../../api/plans";

const CUISINES = [
    "pakistani", "indian", "bangladeshi", "sri lankan", "nepali", "afghan",
    "chinese", "japanese", "korean", "thai", "vietnamese", "indonesian", "malaysian", "filipino",
    "arabic", "lebanese", "turkish", "iranian", "egyptian",
    "nigerian", "ghanaian", "ethiopian", "moroccan", "kenyan", "senegalese", "south african",
    "mexican", "brazilian", "peruvian", "colombian", "argentine",
    "italian", "french", "greek", "spanish", "british", "german",
];

const NUTRITION_OPTIONS = [
    {
        value: "consistent",
        title: "Consistent & healthy",
        description: "I generally eat whole foods and hit my macro goals most days.",
        icon: "restaurant",
    },
    {
        value: "inconsistent",
        title: "Inconsistent",
        description: "I have good days and bad days, or struggle with meal planning.",
        icon: "sync_alt",
    },
    {
        value: "convenience_food",
        title: "Mostly convenience food",
        description: "I rely heavily on takeout, processed foods, or quick meals.",
        icon: "takeout_dining",
    },
];

const DIETARY_OPTIONS = ["none", "halal", "kosher", "vegetarian", "vegan"];

export default function Step6Nutrition() {
    const { data, updateData } = useOnboarding();
    const navigate = useNavigate();

    const [eatingHabits, setEatingHabits] = useState(data.eating_habits || "");
    const [dietaryRestriction, setDietaryRestriction] = useState(data.dietary_restriction || "none");
    const [cuisinePreference, setCuisinePreference] = useState(data.cuisine_preference || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const canFinish = eatingHabits && dietaryRestriction && !submitting;

    async function handleFinish() {
        setError("");
        setSubmitting(true);

        const merged = {
            ...data,
            eating_habits: eatingHabits,
            dietary_restriction: dietaryRestriction,
            cuisine_preference: cuisinePreference,
        };
        updateData({
            eating_habits: eatingHabits,
            dietary_restriction: dietaryRestriction,
            cuisine_preference: cuisinePreference,
        });

        // build_template_id goes to the physique endpoint, not onboarding
        const { build_template_id, ...onboardingPayload } = merged;

        try {
            await submitOnboarding(onboardingPayload);                   // OnboardingProfile
            await createPhysiqueFromTemplate(build_template_id, false);  // Physique only (no auto-plan)
            await generatePlan();                                        // Workout plan (explicit)
            await generateMealPlan();                                    // Meal plan
            sessionStorage.removeItem("onboarding_biometrics");
            navigate("/dashboard");
        } catch (err) {
            const responseData = err.response?.data;
            let message = "Something went wrong finishing setup. Please try again.";
            if (responseData) {
                if (typeof responseData.error === "string") {
                    message = responseData.error;
                } else {
                    const firstKey = Object.keys(responseData)[0];
                    if (firstKey && Array.isArray(responseData[firstKey])) {
                        message = responseData[firstKey][0];
                    }
                }
            }
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="bg-background text-text-primary min-h-screen flex flex-col">
            <header className="bg-background fixed top-0 w-full z-50 border-b border-border">
                <div className="flex items-center px-5 md:px-10 h-16 w-full justify-between">
                    <button
                        aria-label="Go back"
                        className="flex items-center justify-center p-2 -ml-2"
                        onClick={() => navigate(-1)}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="text-lg text-text-primary">Step 6/6</div>
                    <div className="w-10" />
                </div>
                <div className="h-1 bg-surface-container w-full relative">
                    <div className="h-full bg-primary-container transition-all duration-500" style={{ width: "100%" }} />
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto px-5 md:px-10 pt-28 pb-32 flex flex-col">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl text-text-primary mb-4 font-bold tracking-tight">
                        Nutrition snapshot
                    </h1>
                    <p className="text-text-secondary">
                        Help us personalize your meals to your lifestyle and preferences.
                    </p>
                </div>

                {/* Dietary restriction */}
                <section className="mb-8">
                    <h2 className="text-xl text-text-primary mb-3">Any dietary restrictions?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {DIETARY_OPTIONS.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setDietaryRestriction(r)}
                                className={`p-3 rounded-xl border text-sm capitalize transition-all ${dietaryRestriction === r
                                    ? "bg-surface-tint-teal border-primary-container text-primary-container"
                                    : "bg-surface border-border text-text-primary hover:bg-surface-container-high"
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Cuisine preference */}
                <section className="mb-8">
                    <h2 className="text-xl text-text-primary mb-3">Preferred cuisine (optional)</h2>
                    <select
                        className="w-full bg-surface border border-border rounded-[10px] py-3 px-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        value={cuisinePreference}
                        onChange={(e) => setCuisinePreference(e.target.value)}
                    >
                        <option value="">No preference</option>
                        {CUISINES.map((c) => (
                            <option key={c} value={c} className="capitalize">{c}</option>
                        ))}
                    </select>
                </section>

                {/* Eating habits */}
                <section>
                    <h2 className="text-xl text-text-primary mb-3">How would you describe your eating habits?</h2>
                    <div className="flex flex-col gap-4">
                        {NUTRITION_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setEatingHabits(opt.value)}
                                className={`bg-surface border rounded-xl p-5 flex items-center gap-4 transition-all text-left ${eatingHabits === opt.value
                                    ? "bg-surface-tint-teal border-primary-container"
                                    : "border-border hover:bg-surface-container-high"
                                    }`}
                            >
                                <div
                                    className={`shrink-0 mt-0.5 ${eatingHabits === opt.value ? "text-primary-container" : "text-text-secondary"
                                        }`}
                                >
                                    <span className="material-symbols-outlined">{opt.icon}</span>
                                </div>
                                <div className="grow">
                                    <h3 className="text-lg text-text-primary mb-1">{opt.title}</h3>
                                    <p className="text-sm text-text-secondary">{opt.description}</p>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${eatingHabits === opt.value ? "border-primary-container" : "border-text-secondary"
                                        }`}
                                >
                                    {eatingHabits === opt.value && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary-container" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
            </main>

            <footer className="fixed bottom-0 w-full bg-background border-t border-border z-40">
                <div className="flex justify-between items-center py-4 px-5 md:px-10 max-w-2xl mx-auto">
                    <button
                        type="button"
                        onClick={() => navigate("/onboarding/step5")}
                        className="hidden md:block text-sm text-text-secondary hover:text-text-primary transition-colors py-3 px-4 rounded-lg bg-surface border border-border"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        disabled={!canFinish}
                        onClick={handleFinish}
                        className="w-full md:w-auto grow md:grow-0 bg-primary-container text-text-on-primary text-lg font-medium py-3 px-8 rounded-[10px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Setting up your plan..." : "Finish setup"}
                    </button>
                </div>
            </footer>
        </div>
    );
}