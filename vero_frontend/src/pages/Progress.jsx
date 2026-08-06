import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserStats, getHistory, startSession } from "../api/logs";
import { getActivePlan, getRecentAdjustments } from "../api/plans";
import Sidebar from "../components/Sidebar";

function buildHeatmap(consistencyDates) {
    const dateSet = new Set(consistencyDates);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const weeks = [];
    const totalWeeks = 26; 

    const todayDay = today.getDay();
    const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + mondayOffset);

    const startDate = new Date(currentWeekStart);
    startDate.setDate(currentWeekStart.getDate() - (totalWeeks - 1) * 7);

    const current = new Date(startDate);

    for (let w = 0; w < totalWeeks; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const iso = current.toISOString().split("T")[0];
            week.push({
                date: iso,
                active: dateSet.has(iso),
                isFuture: iso > todayStr,
            });
            current.setDate(current.getDate() + 1);
        }
        weeks.push(week);
    }

    return weeks;
}

function getWeeklyCalories(sessions) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStr = oneWeekAgo.toISOString().split("T")[0];

    return sessions
        .filter((s) => s.date >= weekStr && s.status === "completed" && s.calories_burned)
        .reduce((sum, s) => sum + (s.calories_burned || 0), 0);
}

export default function Progress() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [adjustments, setAdjustments] = useState([]);
    const [weeklyCalories, setWeeklyCalories] = useState(null);
    const [heatmapWeeks, setHeatmapWeeks] = useState([]);
    const [loading, setLoading] = useState(true);

    // NEW: State for Sidebar props
    const [plan, setPlan] = useState(null);
    const [startingWorkout, setStartingWorkout] = useState(false);
    const [todaySessionDone, setTodaySessionDone] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [statsData, adjustmentData, historyData, planData] = await Promise.all([
                    getUserStats(),
                    getRecentAdjustments(),
                    getHistory(),
                    getActivePlan(), // Fetch the plan here too
                ]);
                
                setStats(statsData);
                setAdjustments(adjustmentData);
                setWeeklyCalories(getWeeklyCalories(historyData));
                setHeatmapWeeks(buildHeatmap(statsData.consistency_dates || []));
                setPlan(planData); // Save plan to state

                // Check if today's workout is done
                const today = new Date().toISOString().split("T")[0];
                const isDone = historyData.some(s => s.date === today && s.status !== "skipped");
                setTodaySessionDone(isDone);

            } catch (err) {
                console.error("Progress load error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Calculate today's day info for the Sidebar
    const todayDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const todayDay = plan?.days.find((d) => d.day_number === todayDayNumber);

    // Handler for starting workout from the sidebar
    async function handleStartWorkout() {
        if (!todayDay || todayDay.is_rest_day || todaySessionDone) return;
        setStartingWorkout(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            const session = await startSession(todayDay.id, today);
            navigate(`/workout/session/${session.id}`);
        } catch (err) {
            console.error("Failed to start workout:", err);
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

    return (
        <div className="bg-background text-text-primary min-h-screen flex">
            {/* Pass all the props down to the Sidebar! */}
            <Sidebar 
                isRestDay={todayDay?.is_rest_day}
                todayDayId={todayDay?.id}
                onStartWorkout={handleStartWorkout}
                startingWorkout={startingWorkout}
                todaySessionDone={todaySessionDone}
            />

            <main className="md:ml-60 flex-1 pt-8 pb-24 md:pb-12 px-5 md:px-10 min-h-screen">
                <header className="mb-8">
                    <h2 className="text-3xl md:text-4xl text-text-primary tracking-tight">Your Progress</h2>
                    <p className="text-sm text-text-secondary mt-1">Consistency over intensity.</p>
                </header>

                {/* Stats bento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Total workouts */}
                    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-text-secondary mb-4">
                            <span className="material-symbols-outlined text-lg">done_all</span>
                            <span className="text-xs">Total Workouts</span>
                        </div>
                        <div>
                            <div className="text-5xl text-text-primary">{stats?.total_workouts ?? 0}</div>
                            <div className="text-xs text-primary-container mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">fitness_center</span>
                                All time
                            </div>
                        </div>
                    </div>

                    {/* Current streak */}
                    <div className="bg-surface-tint-teal border border-primary-container rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <span className="material-symbols-outlined text-9xl">local_fire_department</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary-container mb-4 relative z-10">
                            <span className="material-symbols-outlined text-lg">local_fire_department</span>
                            <span className="text-xs">Current Streak</span>
                        </div>
                        <div className="relative z-10">
                            <div className="text-5xl text-text-primary">
                                {stats?.current_streak ?? 0}{" "}
                                <span className="text-2xl text-text-secondary">days</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-1">Keep it going</div>
                        </div>
                    </div>

                    {/* Weekly calories */}
                    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-text-secondary mb-4">
                            <span className="material-symbols-outlined text-lg">bolt</span>
                            <span className="text-xs">Active Calories</span>
                        </div>
                        <div>
                            <div className="text-5xl text-text-primary">
                                {weeklyCalories !== null ? weeklyCalories.toLocaleString() : "—"}{" "}
                                <span className="text-2xl text-text-secondary">kcal</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-1">This week's estimate</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Consistency heatmap */}
                    <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
                        <h3 className="text-lg text-text-primary mb-6">Consistency</h3>
                        <div className="overflow-x-auto pb-4">
                            <div className="flex gap-2 min-w-max">
                                {heatmapWeeks.map((week, wi) => (
                                    <div key={wi} className="flex flex-col gap-2">
                                        {week.map((cell, di) => (
                                            <div
                                                key={di}
                                                title={cell.date}
                                                className={`aspect-square rounded-sm w-3.5 ${cell.isFuture
                                                    ? "bg-transparent border border-border/50"
                                                    : cell.active
                                                        ? "bg-primary-container"
                                                        : "bg-border"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 text-text-secondary text-xs">
                            <span>Last 6 months</span>
                            <div className="flex items-center gap-2">
                                <span>Less</span>
                                <div className="flex gap-0.5">
                                    {["bg-border", "bg-surface-tint-teal", "bg-primary-container/60", "bg-primary-container", "bg-primary"].map(
                                        (cls, i) => (
                                            <div key={i} className={`w-3.5 h-3.5 rounded-sm ${cls}`} />
                                        )
                                    )}
                                </div>
                                <span>More</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent AI adjustments */}
                    <div className="bg-surface border border-border rounded-xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg text-text-primary">Recent AI Adjustments</h3>
                            <span className="material-symbols-outlined text-primary-container text-lg">smart_toy</span>
                        </div>

                        {adjustments.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-3 py-8">
                                <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                                <p className="text-sm text-center">
                                    No adjustments yet — your AI coach will update your plan as you log workouts.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 flex-grow">
                                {adjustments.map((adj, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 p-3 rounded-lg bg-background border border-border items-start"
                                    >
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary-container shrink-0" />
                                        <div>
                                            <div className="text-xs text-text-secondary mb-1">{adj.created_at}</div>
                                            <div className="text-sm text-text-primary">{adj.note}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => navigate("/chat")}
                            className="mt-6 w-full py-2 border border-border rounded-lg text-xs text-text-primary hover:bg-surface-container-high transition-colors"
                        >
                            Talk to your AI coach
                        </button>
                    </div>
                </div>

                {/* Adherence rate */}
                {stats?.adherence_rate !== null && stats?.adherence_rate !== undefined && (
                    <div className="mt-6 bg-surface border border-border rounded-xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">30-day adherence</p>
                            <p className="text-2xl text-text-primary mt-1">{stats.adherence_rate}%</p>
                        </div>
                        <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-container rounded-full transition-all"
                                style={{ width: `${stats.adherence_rate}%` }}
                            />
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-background border-t border-border z-50 flex items-center justify-around px-2">
                {[
                    { to: "/dashboard", icon: "home", label: "Home" },
                    { to: "/workouts", icon: "fitness_center", label: "Workouts" },
                    { to: "/progress", icon: "leaderboard", label: "Progress", active: true },
                    { to: "/chat", icon: "chat_bubble", label: "Chat" },
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
        </div>
    );
}