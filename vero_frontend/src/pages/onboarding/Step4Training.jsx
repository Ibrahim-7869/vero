import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

const TRAINING_STYLES = [
    {
        value: "keep_it_simple",
        title: "Bodyweight & simple movements",
        description: "Focus on mastering movement without extra equipment"
    },
    {
        value: "open_to_learning",
        title: "Free weights & complex technique",
        description: "Incorporate dumbbelss, kettlebells, and advanced lifts."
    },
];

const FOCUS_OPTIONS = [
    {
        value: "cardio",
        title: "Cardio",
        description: "Improve endurance and stamina.",
        icon: "directions_run",
    },
    {
        value: "strength",
        title: "Strength training",
        description: "Build muscle and raw power.",
        icon: "fitness_center",
    },
    {
        value: "mix",
        title: "A mix of both",
        description: "Balanced approach for overall fitness.",
        icon: "sync_alt",
    },
];

export default function Step4Training() {
    const { data, updateData } = useOnboarding();
    const navigate = useNavigate();

    const [trainingStyle, setTrainingStyle] = useState(data.training_style || "");
    const [workoutFocus, setWorkoutFocus] = useState(data.workout_focus || "");
    const [experienceLevel, setExperienceLevel] = useState(data.experience_level || "");


    const canContinue = trainingStyle && workoutFocus && experienceLevel;

    function handleContinue() {
        updateData({
            training_style: trainingStyle,
            workout_focus: workoutFocus,
            experience_level: experienceLevel,
        });
        navigate("/onboarding/step5");
    }
    
    return (
        <div className="bg-background text-text-primary min-h-screen flex flex-col">
            <header className="bg-background fixed top-0 w-full z-50 border-b border-border">
                <div className="flex items-center px-5 md:px-10 h-16 w-full justify-between">
                    <button
                        aria-label="Go back"
                        className="flex items-center justify-center p-2 -ml-2"
                        onClick={() => navigate("/onboarding/step3")}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="text-lg text-text-primary">Step 4/6</div>
                    <div className="w-10" />
                </div>
                <div className="h-1 bg-surface-container w-full relative">
                    <div className="h-full bg-primary-container transition-all duration-500" style={{ width: "67%" }} />
                </div>
            </header>
            <main className="flex-1 w-full max-w-3xl mx-auto px-5 md:px-10 pt-28 pb-32 flex flex-col gap-8">
                {/* Experience level */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl text-text-primary">Your experience level</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {["novice", "beginner", "intermediate", "advanced"].map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => setExperienceLevel(level)}
                                className={`p-4 rounded-xl border text-center transition-all capitalize ${experienceLevel === level
                                    ? "bg-surface-tint-teal border-primary-container"
                                    : "bg-surface border-border hover:bg-surface-container-high"
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Training style */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl text-text-primary">Training style</h2>
                    <div className="flex flex-col gap-3">
                        {TRAINING_STYLES.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setTrainingStyle(opt.value)}
                                className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${trainingStyle === opt.value
                                    ? "bg-surface-tint-teal border-primary-container"
                                    : "bg-surface border-border hover:bg-surface-container-high"
                                    }`}
                            >
                                <div className="flex-1">
                                    <h3 className="text-base text-text-primary mb-1">{opt.title}</h3>
                                    <p className="text-sm text-text-secondary">{opt.description}</p>
                                </div>
                                {trainingStyle === opt.value && (
                                    <span className="material-symbols-outlined text-primary-container mt-1">check_circle</span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>



                {/* Focus area */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-2xl text-text-primary">What do you want to focus on?</h2>
                    <div className="flex flex-col gap-3">
                        {FOCUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setWorkoutFocus(opt.value)}
                                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${workoutFocus === opt.value
                                    ? "bg-surface-tint-teal border-primary-container"
                                    : "bg-surface border-border hover:bg-surface-container-high"
                                    }`}
                            >
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-highest text-text-primary shrink-0">
                                    <span className="material-symbols-outlined">{opt.icon}</span>
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="text-base text-text-primary mb-1">{opt.title}</h3>
                                    <p className="text-sm text-text-secondary">{opt.description}</p>
                                </div>
                                {workoutFocus === opt.value && (
                                    <span className="material-symbols-outlined text-primary-container mt-1">check_circle</span>
                                )}
                            </button>
                        ))}
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