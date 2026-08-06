import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { logExercise, completeSession } from "../api/logs";
import { getSession } from "../api/logs";

export default function ActiveWorkout() {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [day, setDay] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentIndex, setCurrentIndex] = useState(0)
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [showPainInput, setShowPainInput] = useState(false);
    const [painDetails, setPainDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const session = await getSession(sessionId);
                const targetDay = session.workout_day_detail;
                setDay(targetDay);
                console.log("DAY EXERCISES:", targetDay.exercises.map((e, i) => ({ index: i, name: e.exercise_name, order: e.order })));
                const firstExercise = targetDay.exercises[0];
                if (firstExercise) {
                    setReps(firstExercise.reps || "");
                }
            } catch {
                setError("Couldn't load your workout.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [sessionId]);

    const currentExercise = day?.exercises[currentIndex];
    const nextExercise = day?.exercises[currentIndex + 1];
    const isLastExercise = day && currentIndex === day.exercises.length - 1;

    function formatTime(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    async function advanceToNext() {
        if (isLastExercise) {
            await finishSession();
        } else {
            setCurrentIndex((i) => i + 1);
            const next = day.exercises[currentIndex + 1];
            setReps(next?.reps || "");
            setWeight("");
            setShowPainInput(false);
            setPainDetails("");
        }
    }



    async function handleCompleteSet() {
        if (!currentExercise) return;
        setSubmitting(true);
        try {
            await logExercise(sessionId, {
                workout_exercise: currentExercise.id,
                completed_sets: currentExercise.sets,
                completed_reps: reps,
                weight_used: weight || null,
                skipped: false,
                reported_pain: showPainInput && painDetails.trim().length > 0,
                pain_details: painDetails,
            });
            await advanceToNext();
        } catch {
            setError("Couldn't save that set. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSkip() {
        if (!currentExercise) return;
        setSubmitting(true);
        try {
            await logExercise(sessionId, {
                workout_exercise: currentExercise.id,
                completed_sets: 0,
                completed_reps: "",
                skipped: true,
                reported_pain: showPainInput && painDetails.trim().length > 0,
                pain_details: painDetails,
            });
            await advanceToNext();
        } catch {
            setError("Couldn't skip that exercise. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    async function finishSession() {
        try {
            const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
            const estimatedCalories = durationMinutes * 8;
            await completeSession(sessionId, {
                duration_minutes: durationMinutes,
                calories_burned: estimatedCalories,
            });
            navigate(`/workout/complete/${sessionId}`, {
                state: { durationMinutes, calories: estimatedCalories },
            });
        } catch {
            setError("Couldn't complete your session. Please try again.");
        }
    }

    async function handleEndWorkout() {
        if (window.confirm("End this workout now? Your progress so far will be saved.")) {
            await finishSession();
        }
    }

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center text-text-secondary">
                Loading...
            </div>
        );
    }

    if (error || !currentExercise) {
        return (
            <div className="bg-background min-h-screen flex flex-col items-center justify-center text-text-secondary gap-4">
                <p>{error || "No exercises found for this workout."}</p>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-primary-container underline"
                >
                    Back to dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-background text-text-primary min-h-screen flex flex-col">
            <header className="w-full flex justify-between items-center p-5 sticky top-0 bg-background/90 backdrop-blur-sm z-10 border-b border-border">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center justify-center w-10 h-10 border border-border rounded-lg text-text-primary"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="flex items-center gap-2 text-text-secondary text-xs">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    SESSION ACTIVE
                </div>
                <button
                    onClick={handleEndWorkout}
                    className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors text-sm"
                >
                    <span className="material-symbols-outlined text-lg">close</span>
                    End
                </button>
            </header>

            <div className="flex-1 flex flex-col items-center w-full max-w-xl mx-auto px-5 pb-8 pt-8">
                <div className="flex flex-col items-center mb-10">
                    <div className="text-5xl text-text-primary font-light">{formatTime(elapsedSeconds)}</div>
                    <div className="text-xs text-text-secondary mt-2 uppercase tracking-widest">Elapsed Time</div>
                </div>

                <div className="w-full bg-surface-tint-teal/10 border border-primary rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl text-text-primary mb-1">{currentExercise.exercise_name}</h2>
                            <p className="text-sm text-primary-container">
                                Exercise {currentIndex + 1} of {day.exercises.length} • {currentExercise.sets} sets
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-text-secondary">Reps</label>
                            <input
                                type="text"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                className="w-full bg-surface border border-border rounded-lg py-3 px-3 text-text-primary text-center text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-text-secondary">Weight (optional)</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="0"
                                className="w-full bg-surface border border-border rounded-lg py-3 px-3 text-text-primary text-center text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder-text-disabled"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowPainInput(!showPainInput)}
                        className="text-xs text-text-secondary underline mb-4"
                    >
                        {showPainInput ? "Cancel pain report" : "Something hurt during this exercise?"}
                    </button>

                    {showPainInput && (
                        <textarea
                            value={painDetails}
                            onChange={(e) => setPainDetails(e.target.value)}
                            placeholder="Briefly describe what hurt..."
                            rows={2}
                            className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-text-primary mb-4 focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder-text-disabled"
                        />
                    )}

                    <button
                        onClick={handleCompleteSet}
                        disabled={submitting}
                        className="w-full bg-primary-container text-text-on-primary py-4 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all mb-3 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        {submitting ? "Saving..." : "Complete Set"}
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSkip}
                            disabled={submitting}
                            className="flex-1 border border-border bg-transparent text-text-primary py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-surface transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">skip_next</span>
                            Skip
                        </button>
                    </div>
                </div>

                {nextExercise && (
                    <div className="w-full mt-8 opacity-60 flex items-center justify-between border-t border-border pt-4 px-2">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-text-secondary">arrow_downward</span>
                            <div className="flex flex-col">
                                <span className="text-xs text-text-secondary">Up Next</span>
                                <span className="text-sm text-text-primary">{nextExercise.exercise_name}</span>
                            </div>
                        </div>
                        <span className="text-sm text-text-secondary">{nextExercise.sets} Sets</span>
                    </div>
                )}
            </div>
        </div>
    );
}
