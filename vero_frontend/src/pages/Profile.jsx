import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { changePassword } from "../api/auth";
import { getOnboardingProfile } from "../api/onboarding";
import { getActivePlan } from "../api/plans";
import { getHistory, startSession } from "../api/logs";
import Sidebar from "../components/Sidebar";

const GOAL_LABELS = {
    lose_weight: "Lose weight",
    build_muscle: "Build muscle",
    general_fitness: "General fitness",
    tone: "Tone and sculpt",
};

const EQUIPMENT_LABELS = {
    no_equipment: "No equipment",
    dumbbells: "Dumbbells",
    resistance_bands: "Resistance bands",
    yoga_mat: "Yoga mat",
    bench: "Bench",
    kettlebells: "Kettlebells",
};

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [onboardingData, setOnboardingData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);

    const [pushNotifs, setPushNotifs] = useState(
        localStorage.getItem("pref_push_notifications") === "true"
    );
    const [dailyReminders, setDailyReminders] = useState(
        localStorage.getItem("pref_daily_reminders") === "true"
    );

    // NEW: State for Sidebar props
    const [plan, setPlan] = useState(null);
    const [startingWorkout, setStartingWorkout] = useState(false);
    const [todaySessionDone, setTodaySessionDone] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                // Fetch onboarding, active plan, and workout history in parallel
                const [profile, planData, historyData] = await Promise.all([
                    getOnboardingProfile(),
                    getActivePlan(),
                    getHistory()
                ]);
                
                setOnboardingData(profile);
                setPlan(planData);

                // Check if today's workout is done
                const today = new Date().toISOString().split("T")[0];
                const isDone = historyData.some(s => s.date === today && s.status !== "skipped");
                setTodaySessionDone(isDone);

            } catch (err) {
                console.error("Profile load error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // NEW: Calculate today's day info for the Sidebar
    const todayDayNumber = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const todayDay = plan?.days.find((d) => d.day_number === todayDayNumber);

    // NEW: Handler for starting workout from the sidebar
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

    function togglePushNotifs() {
        const next = !pushNotifs;
        setPushNotifs(next);
        localStorage.setItem("pref_push_notifications", String(next));
    }

    function toggleDailyReminders() {
        const next = !dailyReminders;
        setDailyReminders(next);
        localStorage.setItem("pref_daily_reminders", String(next));
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters.");
            return;
        }

        setSavingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            setPasswordSuccess("Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setTimeout(() => setShowPasswordForm(false), 1500);
        } catch (err) {
            const msg = err.response?.data?.error || "Couldn't update password. Please try again.";
            setPasswordError(msg);
        } finally {
            setSavingPassword(false);
        }
    }

    function handleSignOut() {
        logout();
        navigate("/login");
    }

    const joinedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : null;

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

            <main className="flex-1 md:ml-60 min-h-screen pb-24 md:pb-8">
                <header className="md:hidden flex items-center justify-between p-5 bg-surface border-b border-border sticky top-0 z-10">
                    <h1 className="text-xl text-primary font-bold">Vero</h1>
                </header>

                <div className="max-w-4xl mx-auto p-5 md:p-10">
                    <div className="mb-8">
                        <h2 className="text-3xl md:text-4xl text-text-primary mb-2">Profile & Settings</h2>
                        <p className="text-text-secondary">Manage your account and preferences.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Profile summary */}
                        <div className="md:col-span-4 bg-surface border border-border rounded-xl p-5 flex flex-col items-center text-center h-fit">
                            <div className="w-24 h-24 rounded-full border-2 border-primary-container p-1 mb-4">
                                <div className="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-primary-container">person</span>
                                </div>
                            </div>
                            <h3 className="text-lg text-text-primary mb-1">
                                {user?.first_name || user?.username || "—"}
                            </h3>
                            {joinedDate && <p className="text-sm text-text-secondary mb-4">Joined {joinedDate}</p>}
                            <button
                                disabled
                                title="Profile editing isn't available yet"
                                className="w-full bg-transparent border border-border text-text-disabled text-sm py-2 rounded-[10px] cursor-not-allowed"
                            >
                                Edit Profile (coming soon)
                            </button>
                        </div>

                        {/* Main settings column */}
                        <div className="md:col-span-8 flex flex-col gap-4">
                            {/* Current focus */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined text-primary-container">track_changes</span>
                                    <h4 className="text-lg text-text-primary">Current Focus</h4>
                                </div>
                                {onboardingData ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-background rounded-lg p-3 border border-border">
                                            <p className="text-xs text-text-secondary uppercase mb-1">Primary Goal</p>
                                            <p className="text-text-primary">
                                                {GOAL_LABELS[onboardingData.primary_goal] || onboardingData.primary_goal}
                                            </p>
                                        </div>
                                        <div className="bg-background rounded-lg p-3 border border-border">
                                            <p className="text-xs text-text-secondary uppercase mb-1">Equipment</p>
                                            <p className="text-text-primary">
                                                {onboardingData.equipment?.map((e) => EQUIPMENT_LABELS[e] || e).join(", ") || "—"}
                                            </p>
                                        </div>
                                        <div className="bg-background rounded-lg p-3 border border-border">
                                            <p className="text-xs text-text-secondary uppercase mb-1">Days per week</p>
                                            <p className="text-text-primary">{onboardingData.days_per_week}</p>
                                        </div>
                                        <div className="bg-background rounded-lg p-3 border border-border">
                                            <p className="text-xs text-text-secondary uppercase mb-1">Time per session</p>
                                            <p className="text-text-primary">{onboardingData.time_per_session} min</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-text-secondary">No onboarding data found.</p>
                                )}
                            </div>

                            {/* Account */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-text-secondary">manage_accounts</span>
                                    <h4 className="text-lg text-text-primary">Account</h4>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs text-text-secondary mb-2">Email Address</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                                            mail
                                        </span>
                                        <input
                                            readOnly
                                            value={user?.email || ""}
                                            className="w-full bg-background border border-border text-text-secondary rounded-[10px] pl-10 pr-3 py-3 text-sm cursor-default"
                                        />
                                    </div>
                                </div>

                                {!showPasswordForm ? (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setShowPasswordForm(true)}
                                            className="text-primary-container hover:text-primary text-sm font-medium transition-colors"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="flex flex-col gap-3 mt-2 pt-4 border-t border-border">
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Current Password</label>
                                            <input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                                className="w-full bg-background border border-border text-text-primary rounded-[10px] px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">New Password</label>
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                className="w-full bg-background border border-border text-text-primary rounded-[10px] px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
                                        {passwordSuccess && <p className="text-primary-container text-xs">{passwordSuccess}</p>}
                                        <div className="flex gap-2 justify-end mt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowPasswordForm(false);
                                                    setPasswordError("");
                                                    setCurrentPassword("");
                                                    setNewPassword("");
                                                }}
                                                className="text-text-secondary text-sm px-4 py-2"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={savingPassword}
                                                className="bg-primary-container text-text-on-primary text-sm px-4 py-2 rounded-[10px] hover:opacity-90 disabled:opacity-50 transition-colors"
                                            >
                                                {savingPassword ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Preferences */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-text-secondary">tune</span>
                                    <h4 className="text-lg text-text-primary">Preferences</h4>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                        <div>
                                            <p className="text-text-primary text-sm">Push Notifications</p>
                                            <p className="text-xs text-text-secondary">Receive alerts for scheduled workouts.</p>
                                        </div>
                                        <button
                                            onClick={togglePushNotifs}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${pushNotifs ? "bg-primary-container" : "bg-surface-container-high"
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${pushNotifs ? "translate-x-full" : ""
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                        <div>
                                            <p className="text-text-primary text-sm">Daily Reminders</p>
                                            <p className="text-xs text-text-secondary">Morning nudge to stay on track.</p>
                                        </div>
                                        <button
                                            onClick={toggleDailyReminders}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${dailyReminders ? "bg-primary-container" : "bg-surface-container-high"
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${dailyReminders ? "translate-x-full" : ""
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-text-disabled mt-3">
                                    Note: notifications aren't sent yet — these preferences are saved for when the feature launches.
                                </p>
                            </div>

                            {/* Sign out */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 border border-red-500/30 text-red-400 text-sm py-2 px-6 rounded-[10px] hover:bg-red-500/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}