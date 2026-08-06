import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProvider, useOnboarding } from "../../context/OnboardingContext";

const EQUIPMENT_OPTIONS = [
    { value: "no_equipment", label: "No equipment", icon: "block" },
    { value: "dumbbells", label: "Dumbbells", icon: "fitness_center" },
    { value: "resistance_bands", label: "Resistance bands", icon: "line_weight" },
    { value: "yoga_mat", label: "Yoga mat", icon: "grid_4x4" },
    { value: "bench", label: "Bench", icon: "table_rows" },
    { value: "kettlebells", label: "Kettlebells", icon: "sports_gymnastics" },
];

const TIME_OPTIONS = [
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "60 min+" },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export default function Step3Logistics() {
    const { data, updateData } = useOnboarding();
    const navigate = useNavigate();

    const [equipment, setEquipment] = useState(data.equipment || []);
    const [timePerSession, setTimePerSession] = useState(data.time_per_session);
    const [daysPerWeek, setDaysPerWeek] = useState(data.days_per_week);

    function toggleEquipment(value) {
        if (value === "no_equipment") {
            setEquipment(["no_equipment"]);
            return;
        }
        setEquipment((prev) => {
            const withoutNone = prev.filter((v) => v !== "no_equipment");
            if (withoutNone.includes(value)) {
                return withoutNone.filter((v) => v !== value);
            }
        });
    }

    const canContinue = equipment.length > 0 && timePerSession !== null && daysPerWeek !== null

    function handleContinue() {
        updateData({
            equipment,
            time_per_session: timePerSession,
            days_per_week: daysPerWeek,
        });
        navigate("/onboarding/step4");
    }

    return (
        <div className="bg-background text-text-primary min-h-screen flex flex-col">
            <header className="bg-background fixed top-0 w-full z-50 border-b border-border">
                <div className="flex items-center px-5 md:px-10 h-16 w-full justify-between">
                    <button
                        aria-label="Go back"
                        className="flex items-center justify-center p-2 -ml-2"
                        onClick={() => navigate("/onboarding/step2")}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="text-lg text-text-primary">Step 3/6</div>
                    <div className="w-10" />
                </div>
                <div className="h-1 bg-surface-container w-full relative">
                    <div className="h-full bg-primary-container transition-all duration-500" style={{ width: "50%" }} />
                </div>
            </header>

            <main className="flex-1 w-full max-w-3xl mx-auto px-5 md:px-10 pt-28 pb-32 flex flex-col gap-8">
                <div className="mb-2">
                    <h1 className="text-3xl md:text-4xl text-text-primary mb-2">Logistics</h1>
                    <p className="text-text-secondary">Let's tailor your plan to what you have available.</p>
                </div>

                {/* Equipment */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-xl text-text-primary">What equipment do you have access to?</h2>
                    <p className="text-sm text-text-secondary -mt-2">Select all that apply.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {EQUIPMENT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggleEquipment(opt.value)}
                                className={`relative flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${equipment.includes(opt.value)
                                        ? "bg-surface-tint-teal border-primary-container"
                                        : "bg-surface border-border hover:bg-surface-container-high"
                                    }`}
                            >
                                <span
                                    className={`material-symbols-outlined mb-2 ${equipment.includes(opt.value) ? "text-primary-container" : "text-text-secondary"
                                        }`}
                                >
                                    {opt.icon}
                                </span>
                                <span className="text-xs text-center">{opt.label}</span>
                                {equipment.includes(opt.value) && (
                                    <span className="material-symbols-outlined absolute top-2 right-2 text-primary-container text-sm">
                                        check_circle
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Time per session */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-xl text-text-primary">How much time can you spend per session?</h2>
                    <div className="flex flex-wrap gap-2">
                        {TIME_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setTimePerSession(opt.value)}
                                className={`px-4 py-2 border rounded-full text-sm transition-colors ${timePerSession === opt.value
                                        ? "bg-surface-tint-teal border-primary-container text-primary-container"
                                        : "bg-surface border-border text-text-primary hover:bg-surface-container-high"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Days per week */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-xl text-text-primary">How many days per week can you commit?</h2>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OPTIONS.map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDaysPerWeek(d)}
                                className={`w-12 h-12 flex items-center justify-center border rounded-full text-sm transition-colors ${daysPerWeek === d
                                        ? "bg-surface-tint-teal border-primary-container text-primary-container"
                                        : "bg-surface border-border text-text-primary hover:bg-surface-container-high"
                                    }`}
                            >
                                {d === 6 ? "6" : d}
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