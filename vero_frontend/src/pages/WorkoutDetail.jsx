import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getWorkoutDay } from "../api/plans";
import { startSession, getHistory } from "../api/logs";
import Sidebar from "../components/Sidebar";

export default function WorkoutDetail() {
    const { dayId } = useParams();
    const navigate = useNavigate();

    const [day, setDay] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [starting, setStarting] = useState(false);
    const [todaySessionDone, setTodaySessionDone] = useState(false); // <-- Added state

    useEffect(() => {
        async function load() {
            try {
                // Fetch both the day details and the user's workout history
                const [data, historyRes] = await Promise.all([getWorkoutDay(dayId), getHistory()]);
                setDay(data);
                
                const today = new Date().toISOString().split("T")[0];
                // Check if THIS specific day was completed today
                const isDone = historyRes.some(
                    (s) => s.date === today && s.status !== "skipped" && s.workout_day === parseInt(dayId)
                );
                setTodaySessionDone(isDone);
            } catch {
                setError("Couldn't load this workout.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [dayId]);

    async function handleStartWorkout() {
        if (!day || day.is_rest_day || todaySessionDone) return; // <-- Added todaySessionDone check
        setStarting(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            const session = await startSession(day.id, today);
            navigate(`/workout/session/${session.id}`);
        } catch (err) {
            const msg = err.response?.data?.error;
            // Fixed typo here: include -> includes
            if (msg?.includes("already completed") || msg?.includes("already started")) {
                setTodaySessionDone(true);
                setError("You've already completed this workout today.");
            } else {
                setError("Couldn't start workout. Please try again.");
            }
        } finally {
            setStarting(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center text-text-secondary">
                Loading...
            </div>
        );
    }

    if (error || !day) {
        return (
            <div className="bg-background min-h-screen flex flex-col items-center justify-center text-text-secondary gap-4">
                <p>{error || "Workout not found."}</p>
                <button onClick={() => navigate("/dashboard")} className="text-primary-container underline">
                    Back to dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-background text-text-primary min-h-screen flex">
            {/* Pass all the props to the Sidebar so it stays in sync! */}
            <Sidebar 
                onStartWorkout={handleStartWorkout}
                startingWorkout={starting}
                todaySessionDone={todaySessionDone}
                isRestDay={day?.is_rest_day}
                todayDayId={dayId}
            />

            <main className="flex-1 md:ml-60 min-h-screen pb-24 md:pb-8 flex flex-col">
                {/* Mobile header */}
                <header className="md:hidden flex items-center justify-between p-5 border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-text-secondary w-10 h-10 flex items-center justify-center hover:bg-surface-container-high rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg text-text-primary">Workout Detail</h1>
                    <div className="w-10 h-10" />
                </header>

                <div className="max-w-4xl w-full mx-auto p-5 md:p-10 flex-1 flex flex-col">
                    {/* Hero */}
                    <section className="mb-8 relative rounded-2xl overflow-hidden border border-border bg-surface">
                        <div className="absolute inset-0 bg-linear-to-br from-surface-tint-teal/30 to-background opacity-50" />
                        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    {day.estimated_duration_minutes && (
                                        <span className="px-2.5 py-1 bg-surface-container-high rounded-full border border-border text-xs text-text-secondary flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            {day.estimated_duration_minutes} min
                                        </span>
                                    )}
                                    <span className="px-2.5 py-1 bg-surface-container-high rounded-full border border-border text-xs text-text-secondary flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">fitness_center</span>
                                        {day.exercises.length} exercises
                                    </span>
                                </div>
                                <h2 className="text-4xl text-text-primary mb-2">{day.label}</h2>
                                <p className="text-text-secondary max-w-xl">
                                    Review your exercises below, then hit Start Workout when you're ready.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Exercise list */}
                    <section className="flex-1 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl text-text-primary">
                                Exercises ({day.exercises.length})
                            </h3>
                        </div>

                        {day.is_rest_day ? (
                            <div className="flex flex-col items-center justify-center py-16 text-text-secondary gap-3">
                                <span className="material-symbols-outlined text-5xl">self_improvement</span>
                                <p className="text-lg">Rest day — take it easy today.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {day.exercises.map((ex, index) => (
                                    <article
                                        key={ex.id}
                                        className="bg-surface border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:border-surface-tint transition-colors"
                                    >
                                        {/* GIF / placeholder */}
                                        <div className="w-full sm:w-32 h-32 rounded-lg bg-surface-container-high border border-border shrink-0 flex items-center justify-center overflow-hidden relative">
                                            {ex.gif_url ? (
                                                <img
                                                    src={ex.gif_url}
                                                    alt={ex.exercise_name}
                                                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-primary text-4xl">
                                                    fitness_center
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h4 className="text-lg text-text-primary mb-1">
                                                {index + 1}. {ex.exercise_name}
                                            </h4>
                                            <p className="text-sm text-primary-container mb-2">
                                                {ex.sets} sets × {ex.reps} reps
                                                {ex.rest_seconds && (
                                                    <span className="text-text-secondary ml-2">
                                                        · {ex.rest_seconds}s rest
                                                    </span>
                                                )}
                                            </p>
                                            {ex.target_muscles?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {ex.target_muscles.map((m) => (
                                                        <span
                                                            key={m}
                                                            className="px-2 py-0.5 bg-surface-container-high rounded-full text-xs text-text-secondary border border-border capitalize"
                                                        >
                                                            {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Show first instruction step if available */}
                                            {ex.instructions?.length > 0 && (
                                                <p className="text-sm text-text-secondary line-clamp-2">
                                                    {ex.instructions[0]}
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* CTA */}
                    {!day.is_rest_day && (
                        <div className="pt-4">
                            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                            <button
                                onClick={handleStartWorkout}
                                disabled={starting || todaySessionDone} // <-- Disable if done
                                className="w-full py-4 px-6 bg-primary-container text-text-on-primary text-xl font-medium rounded-[10px] hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined text-2xl">play_circle</span>
                                {/* Change text if done */}
                                {todaySessionDone ? "Done Today" : (starting ? "Starting..." : "Start Workout")}
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile bottom nav */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-background border-t border-border z-50 flex items-center justify-around px-2">
                    {[
                        { to: "/dashboard", icon: "home", label: "Home" },
                        { to: null, icon: "fitness_center", label: "Workouts", active: true },
                        { to: "/progress", icon: "leaderboard", label: "Progress" },
                        { to: "/profile", icon: "person", label: "Profile" },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => item.to && navigate(item.to)}
                            className={`flex flex-col items-center justify-center w-16 h-full ${item.active ? "text-primary" : "text-text-secondary"
                                }`}
                        >
                            <span className="material-symbols-outlined mb-1">{item.icon}</span>
                            <span className="text-[10px]">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </main>
        </div>
    );
}