import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getActivePlan } from "../api/plans";
import { getUserStats, startSession, getHistory } from "../api/logs";
import Sidebar from "../components/Sidebar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REST_ICON = "self_improvement";

function getTodayDayNumber() {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [plan, setPlan] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [startingWorkout, setStartingWorkout] = useState(false);
    const [todaySessionDone, setTodaySessionDone] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [planData, statsData] = await Promise.all([getActivePlan(), getUserStats()]);
                setPlan(planData);
                setStats(statsData);
                
                const today = new Date().toISOString().split("T")[0];
                const historyRes = await getHistory();
                const todayDone = historyRes.some(
                    (s) => s.date === today && s.status !== "skipped"
                );
                setTodaySessionDone(todayDone);
            } catch (err) {
                console.log("DASHBOARD LOAD ERROR:", err);
                if (err.response?.status === 404) {
                    setError("No active plan found yet.");
                } else {
                    setError("Something went wrong loading your dashboard.");
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const todayDayNumber = getTodayDayNumber();
    const todayDay = plan?.days.find((d) => d.day_number === todayDayNumber);

    async function handleStartWorkout() {
        if (!todayDay || todayDay.is_rest_day) return;
        if (todaySessionDone) {
            setError("You've already completed today's workout.");
            return;
        }
        
        setStartingWorkout(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            const session = await startSession(todayDay.id, today);
            navigate(`/workout/session/${session.id}`);
        } catch (err) {
            const msg = err.response?.data?.error;
            if (msg?.includes("already completed") || msg?.includes("already started")) {
                setTodaySessionDone(true);
                setError("You've already completed today's workout.");
            } else {
                setError("Couldn't start your workout. Please try again.");
            }
        } finally {
            setStartingWorkout(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center text-text-secondary">
                Loading...
            </div>
        );
    }

    const firstName = user?.first_name || user?.username || "there";

    return (
        <div className="bg-background text-text-primary flex min-h-screen">
            <Sidebar
                onStartWorkout={handleStartWorkout}
                startingWorkout={startingWorkout}
                todaySessionDone={todaySessionDone}
                isRestDay={todayDay?.is_rest_day}
                todayDayId={todayDay?.id}
            />

            <main className="flex-1 md:ml-60 min-h-screen p-5 md:p-10">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <p className="text-text-secondary mb-1">Good morning,</p>
                        <h2 className="text-4xl text-text-primary">{firstName}</h2>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {plan && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Today's focus */}
                        <div className="md:col-span-8 bg-surface border border-border rounded-2xl p-5 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-tint-teal/30 border border-primary-container/20 text-primary-container text-xs mb-4">
                                            <span className="material-symbols-outlined text-sm">bolt</span> Today's Focus
                                        </span>
                                        {todayDay ? (
                                            <>
                                                <h3 className="text-3xl text-text-primary mb-2">{todayDay.label}</h3>
                                                {todayDay.is_rest_day ? (
                                                    <p className="text-text-secondary flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-base">{REST_ICON}</span>
                                                        Rest day — recovery is part of the plan.
                                                    </p>
                                                ) : (
                                                    <p className="text-text-secondary flex items-center gap-3 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-base">schedule</span>
                                                            {todayDay.estimated_duration_minutes} min
                                                        </span>
                                                        <span>•</span>
                                                        <span>{todayDay.exercises.length} exercises</span>
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-text-secondary">No workout scheduled for today.</p>
                                        )}
                                    </div>
                                </div>

                                {todayDay && !todayDay.is_rest_day && todayDay.exercises.length > 0 && (
                                    <div className="flex items-end justify-between mt-auto">
                                        <div className="space-y-1">
                                            <p className="text-xs text-text-secondary">First up</p>
                                            <p className="text-text-primary">{todayDay.exercises[0].exercise_name}</p>
                                            <p className="text-xs text-text-secondary">
                                                {todayDay.exercises[0].sets} sets x {todayDay.exercises[0].reps} reps
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleStartWorkout}
                                            disabled={startingWorkout || todaySessionDone}
                                            className="bg-primary-container text-text-on-primary text-sm px-6 py-3 rounded-[10px] hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {todaySessionDone ? "Done Today" : (startingWorkout ? "Starting..." : "Start Workout")}
                                            {!startingWorkout && !todaySessionDone && <span className="material-symbols-outlined text-lg">play_arrow</span>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats stack */}
                        <div className="md:col-span-4 flex flex-col gap-4">
                            <div className="bg-surface border border-border rounded-2xl p-5 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm text-text-secondary">Active Streak</h4>
                                    <span className="material-symbols-outlined text-tertiary-container">local_fire_department</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl text-text-primary">{stats?.current_streak ?? 0}</span>
                                    <span className="text-sm text-text-secondary">days</span>
                                </div>
                            </div>

                            <div className="bg-surface border border-border rounded-2xl p-5 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm text-text-secondary">Total Workouts</h4>
                                    <span className="material-symbols-outlined text-primary-container">stacked_bar_chart</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl text-text-primary">{stats?.total_workouts ?? 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* This week */}
                        <div className="md:col-span-12 bg-surface border border-border rounded-2xl p-5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg text-text-primary">This Week</h3>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                                {plan.days.map((day) => {
                                    const isToday = day.day_number === todayDayNumber;
                                    return (
                                        <div
                                            key={day.id}
                                            onClick={() => navigate(`workout/day/${day.id}`)}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border relative ${isToday
                                                ? "border-primary-container bg-surface-tint-teal"
                                                : "border-border bg-surface-container-low"
                                                }`}
                                        >
                                            {isToday && (
                                                <div className="absolute -top-1.5 bg-primary-container text-text-on-primary text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                                                    Today
                                                </div>
                                            )}
                                            <span className={`text-xs mt-1 ${isToday ? "text-primary-container" : "text-text-secondary"}`}>
                                                {WEEKDAY_LABELS[day.day_number - 1]}
                                            </span>
                                            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-border">
                                                <span
                                                    className={`material-symbols-outlined text-lg ${isToday ? "text-primary-container" : "text-text-secondary"
                                                        }`}
                                                >
                                                    {day.is_rest_day ? REST_ICON : "fitness_center"}
                                                </span>
                                            </div>
                                            <span className="text-xs text-text-secondary truncate max-w-full">{day.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}