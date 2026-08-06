import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ 
    isRestDay, 
    todayDayId, 
    onStartWorkout, 
    startingWorkout, 
    todaySessionDone 
}) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const NAV_ITEMS = [
        { to: "/dashboard", label: "Home", icon: "home" },
        { to: todayDayId ? `/workout/day/${todayDayId}` : "/dashboard", label: "Workouts", icon: "fitness_center" },
        { to: "/progress", label: "Progress", icon: "leaderboard" },
        { to: "/chat", label: "Chat", icon: "chat_bubble" },
        { to: "/profile", label: "Profile", icon: "person" },
    ];

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <nav className="bg-surface text-primary h-screen w-60 fixed left-0 top-0 border-r border-border hidden md:flex flex-col py-4 px-4 z-50">
            <div className="flex items-center gap-3 mb-8 px-4 mt-4">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-border">
                    <span className="material-symbols-outlined text-primary-container">fitness_center</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-primary">Vero</h1>
                    <p className="text-xs text-text-secondary">Coaching</p>
                </div>
            </div>

            <div className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "text-primary font-bold border-l-4 border-primary bg-surface-tint-teal/10"
                                : "text-text-secondary hover:bg-surface-container-high"
                            }`
                        }
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="mt-auto pt-4 space-y-2">
                {/* Rest Day State */}
                {isRestDay ? (
                    <div className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary text-sm">
                        <span className="material-symbols-outlined text-lg">self_improvement</span>
                        <span>Rest day today</span>
                    </div>
                ) : !todaySessionDone ? (
                    /* Active Workout State */
                    <button
                        onClick={onStartWorkout}
                        disabled={startingWorkout}
                        className="w-full bg-primary-container text-text-on-primary text-sm px-4 py-3 rounded-[10px] hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {startingWorkout ? "Starting..." : "Start Workout"}
                        {!startingWorkout && <span className="material-symbols-outlined text-lg">play_arrow</span>}
                    </button>
                ) : (
                    /* Completed Workout State */
                    <div className="w-full flex items-center gap-3 px-4 py-3 text-primary-container text-sm">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        <span>Workout done today</span>
                    </div>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-container-high transition-colors"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span>Log out</span>
                </button>
            </div>
        </nav>
    );
}