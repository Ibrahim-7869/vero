import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProvider, useOnboarding } from "../../context/OnboardingContext";
import { submitOnboarding } from "../../api/onboarding";
import { generatePlan } from "../../api/plans";

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
        description: "I reply heavily on takeout. processed foods, or quick meals.",
        icon: "takeout_dining",
    },
];

export default function Step6Nutrition() {
    const { data, updateData } = useOnboarding();
    const navigate = useNavigate();

    const [eatingHabits, setEatingHabits] = useState(data.eating_habits || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const canFinish = eatingHabits && !submitting;

    async function handleFinish() {
        setError("");
        setSubmitting(true);

        const fullPayload = { ...data, eating_habits: eatingHabits };
        updateData({ eating_habits: eatingHabits });

        try {
            await submitOnboarding(fullPayload);
            await generatePlan();
            navigate("/dashboard");
        } catch (err) {
            const responseData = err.response?.data;
            let message = "Something went wrong finishing setup. Please try again."
            if (responseData) {
                const firstKey = Object.keys(responseData)[0];
                if (firstKey && Array.isArray(responseData)[firstKey]) {
                    message = `${firstKey.replace(/_/g, "")}: $responseData[firstKey][0]`;
                } else if (typeof responseData.error === "string") {
                    message = responseData.error;
                }
            }
            setError(message)
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
                        How would you describe your current eating habits? This is just a lightweight snapshot to help us
                        tailor your coaching.
                    </p>
                </div>

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