import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { completeSession } from "../api/logs";

const FEEDBACK_OPTIONS = [
    { value: "too_easy", label: "Too easy", icon: "sentiment_satisfied" },
    { value: "just_right", label: "Just right", icon: "thumb_up" },
    { value: "too_hard", label: "Too hard", icon: "sentiment_very_dissatisfied" },
];

export default function WorkoutComplete() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const durationMinutes = location.state?.durationMinutes ?? null;
    const calories = location.state?.calories ?? null;

    const [feedback, setFeedback] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleFeedback(value) {
        setFeedback(value);
        setSubmitting(true);
        try {
            await completeSession(sessionId, {
                feedback: value,
                duration_minutes: durationMinutes,
                calories_burned: calories,
            });
        } catch {

        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="bg-background text-text-primary min-h-screen flex items-center justify-center p-5">
            <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-8 md:p-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-surface-tint-teal/20 border border-primary-container flex items-center justify-center mb-8">
                    <span className="material-symbols-outlined text-5xl text-primary-container">check_circle</span>
                </div>

                <h1 className="text-4xl text-text-primary text-center mb-2">Workout Complete!</h1>
                <p className="text-text-secondary text-center mb-8">
                    Great job showing up today. Here's your summary.
                </p>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-background border border-border rounded-lg p-6 flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary-container mb-2">timer</span>
                        <span className="text-2xl text-text-primary mb-1">{durationMinutes ?? "—"}</span>
                        <span className="text-xs text-text-secondary">MINUTES</span>
                    </div>
                    <div className="bg-background border border-border rounded-lg p-6 flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-primary-container mb-2">local_fire_department</span>
                        <span className="text-2xl text-text-primary mb-1">{calories ?? "—"}</span>
                        <span className="text-xs text-text-secondary">KCAL (EST.)</span>
                    </div>
                </div>

                <div className="w-full border-t border-border pt-8 mb-8 flex flex-col items-center">
                    <h3 className="text-lg text-text-primary mb-6">How did it feel?</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {FEEDBACK_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleFeedback(opt.value)}
                                disabled={submitting}
                                className={`px-6 py-3 rounded-full border text-sm transition-colors flex items-center gap-2 disabled:opacity-60 ${feedback === opt.value
                                        ? "border-primary-container bg-surface-tint-teal/20 text-primary-container"
                                        : "border-border bg-background text-text-primary hover:border-primary-container"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full max-w-sm bg-primary-container text-text-on-primary h-12 rounded-[10px] hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                    Back to Dashboard
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}