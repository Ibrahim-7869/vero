import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

const GOALS = [
    { value: "lose_weight", label: "Lose weight", icon: "monitor_weight" },
    { value: "build_muscle", label: "Build muscle", icon: "fitness_center" },
    { value: "general_fitness", label: "General fitness", icon: "vital_signs" },
    { value: "tone", label: "Tone and sculpt", icon: "accessibility_new" },
];

const SUCCESS_OPTIONS = [
    { value: "noticeably_fitter", label: "Noticeably fitter" },
    { value: "clothing_size", label: "Down a clothing size" },
    { value: "consistent_habit", label: "Consistent habit builtvital_signs" },
    { value: "muscle_definition", label: "Visible muscle definition" },
    { value: "other", label: "Something else" },
];

const BODY_TYPES = [
    { value: "slim", label: "Slim", icon: "accessibility" },
    { value: "average", label: "Average", icon: "accessibility" },
    { value: "athletic", label: "Athletic", icon: "accessibility_new" },
    { value: "larger_build", label: "Larger build", icon: "directions_run" },
];

export default function Step2Goals() {
    const { data, updateData } = useOnboarding();
    const navigate = useNavigate();

    const [goal, setGoal] = useState(data.primary_goal ||"");
    const [successVision, setSuccessVision] = useState(data.success_vision || "");
    const [successOther, setSuccessOther] = useState(data.success_vision_other || "");
    const [bodyType, setBodyType] = useState(data.body_type || "");

    const canContinue =
        goal &&
        successVision &&
        (successVision !== "others" || successOther.trim().length > 0) &&
        bodyType;

    function handleContinue() {
        updateData({
            primary_goal: goal,
            success_vision: successVision,
            success_vision_other: successVision === "other" ? successOther : "",
            body_type: bodyType,
        });

        navigate("/onboarding/step3");
    }
    return (
        <div className="bg-background text-text-primary min-h-screen flex flex-col">
            <header className="bg-background fixed top-0 w-full z-50 border-b border-border">
                <div className="flex items-center px-5 md:px-10 h-16 w-full justify-between">
                    <button
                        aria-label="Go back"
                        className="flex items-center justify-center p-2 -ml-2"
                        onClick={() => navigate("/onboarding/step1")}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="text-lg text-text-primary">Step 2/6</div>
                    <div className="w-10" />
                </div>
                <div className="h-1 bg-surface-container w-full relative">
                    <div className="h-full bg-primary-container transition-all duration-500" style={{ width: "33%" }} />
                </div>
            </header>
            <main className="flex-1 w-full max-w-3xl mx-auto px-5 md:px-10 pt-28 pb-32 flex flex-col gap-8">
                <div className="flex flex-col gap-1 text-center">
                    <h1 className="text-3xl md:text-4xl text-text-primary">What's your goal?</h1>
                    <p className="text-text-secondary">This shapes the plan we build for you.</p>
                </div>

                {/* Primary goal */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl text-text-primary">Primary goal</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {GOALS.map((g) => (
                            <button
                                key={g.value}
                                type="button"
                                onClick={() => setGoal(g.value)}
                                className={`flex items-center p-4 border rounded-2xl text-left transition-all ${goal === g.value
                                        ? "bg-surface-tint-teal border-primary-container"
                                        : "bg-surface border-border hover:bg-surface-variant"
                                    }`}
                            >
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${goal === g.value ? "bg-surface-container-high" : "bg-surface-container"
                                        }`}
                                >
                                    <span
                                        className={`material-symbols-outlined ${goal === g.value ? "text-primary-container" : "text-text-secondary"
                                            }`}
                                    >
                                        {g.icon}
                                    </span>
                                </div>
                                <span className="font-medium">{g.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Success vision */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl text-text-primary">What would success look like in 3 months?</h2>
                    <div className="flex flex-wrap gap-3">
                        {SUCCESS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSuccessVision(opt.value)}
                                className={`border rounded-full px-6 py-3 text-sm transition-all ${successVision === opt.value
                                        ? "bg-surface-tint-teal border-primary-container text-primary-container"
                                        : "border-border text-text-primary hover:bg-surface-variant"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {successVision === "other" && (
                        <input
                            type="text"
                            placeholder="Tell us what success looks like for you"
                            value={successOther}
                            onChange={(e) => setSuccessOther(e.target.value)}
                            className="w-full bg-surface border border-border rounded-[10px] p-3 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder:text-text-secondary"
                        />
                    )}
                </section>

                {/* Body type */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl text-text-primary">Which body type is closest to yours?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {BODY_TYPES.map((bt) => (
                            <button
                                key={bt.value}
                                type="button"
                                onClick={() => setBodyType(bt.value)}
                                className={`flex flex-col items-center justify-center p-6 border rounded-2xl text-center transition-all gap-3 ${bodyType === bt.value
                                        ? "bg-surface-tint-teal border-primary-container"
                                        : "bg-surface border-border hover:bg-surface-variant"
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined text-4xl ${bodyType === bt.value ? "text-primary-container" : "text-text-secondary"
                                        }`}
                                >
                                    {bt.icon}
                                </span>
                                <span className="font-medium text-sm">{bt.label}</span>
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