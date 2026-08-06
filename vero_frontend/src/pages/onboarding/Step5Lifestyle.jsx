import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

const SLEEP_OPTIONS = [
    { value: "under_5", label: "< 5 hrs" },
    { value: "5_7", label: "5 - 7 hrs" },
    { value: "7_9", label: "7 - 9 hrs" },
    { value: "9_plus", label: "9+ hrs" },
];

const STRESS_OPTIONS = [
    { value: "low", label: "Low", icon: "sentiment_calm" },
    { value: "medium", label: "Moderate", icon: "sentiment_neutral" },
    { value: "high", label: "High", icon: "sentiment_very_dissatisfied" },
];

export default function Step5Lifestyle() {
    const { data, updateData } = useOnboarding();
    const navigate = useNavigate();

    const [sleepHours, setSleepHours] = useState(data.sleep_hours ?? null);
    const [stressLevel, setStressLevel] = useState(data.stress_level ?? null);
    const [smokes, setSmokes] = useState(data.smokes_or_drinks === true);
    const [drinks, setDrinks] = useState(data.smokes_or_drinks === true);
    const [habitsResolved, setHabitsResolved] = useState(data.smokes_or_drinks === true);
    const [habitsSkipped, setHabitsSkipped] = useState(false);

    const canContinue = sleepHours !== null && stressLevel !== null && habitsResolved;

    function toggleSleepSkip() {
        setSleepHours((prev) => (prev === "skip" ? null : "skip"));
    }

    function toggleStressSkip() {
        setStressLevel((prev) => (prev === "skip" ? null : "skip"));
    }

    function toggleHabitsSkip() {
        setHabitsSkipped((prev) => {
            const next = !prev;
            if (next) {
                setSmokes(false);
                setDrinks(false);
            }
            setHabitsResolved(true);
            return next;
        });
    }

    function handleSmokesChange(checked) {
        setSmokes(checked);
        setHabitsResolved(true);
    }

    function handleDrinksChange(checked) {
        setDrinks(checked);
        setHabitsResolved(true);
    }

    function handleContinue() {
        if (!canContinue) return;
        updateData({
            sleep_hours: sleepHours === "skip" ? null : sleepHours,
            stress_level: stressLevel === "skip" ? null : stressLevel,
            smokes_or_drinks: habitsSkipped ? null : smokes || drinks,
        });
        navigate("/onboarding/step6");
    }

    return (
        <div className="bg-background text-text-primary min-h-screen flex flex-col">
            <header className="bg-background fixed top-0 w-full z-50 border-b border-border">
                <div className="flex items-center px-5 md:px-10 h-16 w-full justify-between">
                    <button
                        aria-label="Go back"
                        className="flex items-center justify-center p-2 -ml-2"
                        onClick={() => navigate("/onboarding/step4")}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="text-lg text-text-primary">Step 5/6</div>
                    <div className="w-10" />
                </div>
                <div className="h-1 bg-surface-container w-full relative">
                    <div className="h-full bg-primary-container transition-all duration-500" style={{ width: "83%" }} />
                </div>
            </header>

            <main className="flex-1 w-full max-w-3xl mx-auto px-5 md:px-10 pt-28 pb-32 flex flex-col gap-8">
                <div className="mb-2">
                    <h1 className="text-3xl md:text-4xl text-text-primary mb-2">Lifestyle baseline</h1>
                    <p className="text-text-secondary">
                        Tell us a bit about your daily habits to help tailor your coaching. All questions are optional.
                    </p>
                </div>

                {/* Sleep */}
                <section className="flex flex-col gap-3">
                    <div className="flex justify-between items-baseline">
                        <h2 className="text-xl text-text-primary">Average sleep per night</h2>
                        <button
                            type="button"
                            onClick={toggleSleepSkip}
                            className={`text-xs underline transition-colors ${sleepHours === "skip" ? "text-primary-container" : "text-text-secondary hover:text-primary"
                                }`}
                        >
                            Prefer not to say
                        </button>
                    </div>
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${sleepHours === "skip" ? "opacity-40" : ""}`}>
                        {SLEEP_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                disabled={sleepHours === "skip"}
                                onClick={() => setSleepHours(opt.value)}
                                className={`h-16 rounded-[10px] border text-sm transition-all ${sleepHours === opt.value
                                    ? "bg-surface-tint-teal border-primary-container text-primary-container"
                                    : "bg-surface border-border text-text-secondary hover:border-text-secondary"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Stress */}
                <section className="flex flex-col gap-3">
                    <div className="flex justify-between items-baseline">
                        <h2 className="text-xl text-text-primary">Current stress level</h2>
                        <button
                            type="button"
                            onClick={toggleStressSkip}
                            className={`text-xs underline transition-colors ${stressLevel === "skip" ? "text-primary-container" : "text-text-secondary hover:text-primary"
                                }`}
                        >
                            Prefer not to say
                        </button>
                    </div>
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${stressLevel === "skip" ? "opacity-40" : ""}`}>
                        {STRESS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                disabled={stressLevel === "skip"}
                                onClick={() => setStressLevel(opt.value)}
                                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${stressLevel === opt.value
                                    ? "bg-surface-tint-teal border-primary-container text-primary-container"
                                    : "bg-surface border-border text-text-secondary hover:border-text-secondary"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-3xl">{opt.icon}</span>
                                <span className="text-sm">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Habits */}
                <section className="flex flex-col gap-3">
                    <div className="flex justify-between items-baseline">
                        <h2 className="text-xl text-text-primary">
                            Habits <span className="text-text-secondary text-sm">(optional)</span>
                        </h2>
                        <button
                            type="button"
                            onClick={toggleHabitsSkip}
                            className={`text-xs underline transition-colors ${habitsSkipped ? "text-primary-container" : "text-text-secondary hover:text-primary"
                                }`}
                        >
                            Prefer not to say
                        </button>
                    </div>
                    <div className={`flex flex-col gap-3 ${habitsSkipped ? "opacity-40" : ""}`}>
                        <label
                            className={`flex items-center justify-between p-4 rounded-2xl border bg-surface transition-colors ${habitsSkipped ? "" : "hover:bg-surface-container-high cursor-pointer"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-text-secondary">smoking_rooms</span>
                                <span className="text-base">Smoking</span>
                            </div>
                            <div
                                onClick={() => !habitsSkipped && handleSmokesChange(!smokes)}
                                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${smokes ? "bg-primary-container" : "bg-surface-container-high"
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all ${smokes ? "translate-x-full bg-text-on-primary" : "bg-text-secondary"
                                        }`}
                                />
                            </div>
                        </label>

                        <label
                            className={`flex items-center justify-between p-4 rounded-2xl border bg-surface transition-colors ${habitsSkipped ? "" : "hover:bg-surface-container-high cursor-pointer"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-text-secondary">local_bar</span>
                                <span className="text-base">Drinking</span>
                            </div>
                            <div
                                onClick={() => !habitsSkipped && handleDrinksChange(!drinks)}
                                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${drinks ? "bg-primary-container" : "bg-surface-container-high"
                                    }`}
                            >
                                <div
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all ${drinks ? "translate-x-full bg-text-on-primary" : "bg-text-secondary"
                                        }`}
                                />
                            </div>
                        </label>
                    </div>
                </section>
            </main>

            <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-md border-t border-border p-5 md:px-10 md:py-6 flex justify-center z-40">
                <div className="w-full max-w-3xl">
                    <button
                        type="button"
                        disabled={!canContinue}
                        onClick={handleContinue}
                        className="w-full bg-primary-container text-text-on-primary text-lg font-medium rounded-lg py-4 hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}