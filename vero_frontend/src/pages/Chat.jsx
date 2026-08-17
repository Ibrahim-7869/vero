import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getChatHistory, sendMessage } from "../api/chat";
import { getActivePlan } from "../api/plans";
import { getHistory, startSession } from "../api/logs";
import Sidebar from "../components/Sidebar";

export default function Chat() {
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // NEW: State for Sidebar props
    const [plan, setPlan] = useState(null);
    const [startingWorkout, setStartingWorkout] = useState(false);
    const [todaySessionDone, setTodaySessionDone] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                // Fetch chat history, active plan, and workout history in parallel
                const [history, planData, historyData] = await Promise.all([
                    getChatHistory(),
                    getActivePlan(),
                    getHistory()
                ]);
                
                setMessages(history);
                setPlan(planData);

                // Check if today's workout is done
                const today = new Date().toISOString().split("T")[0];
                const isDone = historyData.some(s => s.date === today && s.status !== "skipped");
                setTodaySessionDone(isDone);

            } catch (err) {
                console.error("Chat load error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

    async function handleSend() {
        const text = input.trim();
        if (!text || sending) return;

        const userMsg = { id: `temp-${Date.now()}`, role: "user", content: text, created_at: new Date().toISOString() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setSending(true);

        try {
            const data = await sendMessage(text);
            const aiMsg = {
                id: `ai-${Date.now()}`,
                role: "assistant",
                content: data.reply,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch {
            setMessages((prev) => [
                ...prev.filter((m) => m.id !== userMsg.id),
                {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: "Sorry, I couldn't respond right now. Please try again.",
                    created_at: new Date().toISOString(),
                }
            ]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // Helper function to group messages
    function groupMessagesByDate(msgs) {
        const groups = [];
        let lastDate = null;
        
        msgs.forEach((msg) => {
            const dateStr = msg.created_at
                ? new Date(msg.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                })
                : null;

            if (dateStr && dateStr !== lastDate) {
                groups.push({ type: "separator", label: dateStr });
                lastDate = dateStr;
            }
            groups.push({ type: "message", msg });
        });

        return groups;
    }

    const grouped = groupMessagesByDate(messages);

    if (loading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center text-text-secondary">
                Loading...
            </div>
        );
    }

    return (
        <div className="bg-background text-text-primary h-screen flex overflow-hidden">
            {/* Pass all the props down to the Sidebar! */}
            <Sidebar 
                isRestDay={todayDay?.is_rest_day}
                todayDayId={todayDay?.id}
                onStartWorkout={handleStartWorkout}
                startingWorkout={startingWorkout}
                todaySessionDone={todaySessionDone}
            />

            <main className="flex-1 md:ml-60 h-full flex flex-col">
                {/* Desktop header */}
                <div className="hidden md:flex items-center justify-between px-10 py-6 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl text-text-primary">Vero AI Coach</h2>
                        <p className="text-sm text-text-secondary mt-1">Always here to adapt your plan.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                        <span className="text-xs text-text-secondary">Online</span>
                    </div>
                </div>

                {/* Mobile header */}
                <header className="md:hidden fixed top-0 w-full bg-surface/90 backdrop-blur-md z-40 border-b border-border px-5 py-4 flex items-center justify-between">
                    <h1 className="text-lg text-text-primary">Chat</h1>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 md:px-10 py-6 pt-20 md:pt-6 pb-32 flex flex-col gap-6">
                    {!messages || messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-text-secondary py-16">
                            <span className="material-symbols-outlined text-5xl text-primary-container">smart_toy</span>
                            <p className="text-center max-w-xs">
                                Your AI coach is ready. Ask about your plan, request adjustments, or just check in.
                            </p>
                            <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
                                {[
                                    "How's my plan looking this week?",
                                    "I don't want to do squats anymore.",
                                    "My knee has been hurting after lunges.",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-container-high transition-colors text-text-primary"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        grouped.map((item, i) => {
                            if (item.type === "separator") {
                                return (
                                    <div key={`sep-${i}`} className="flex justify-center">
                                        <span className="text-xs text-text-disabled bg-surface px-3 py-1 rounded-full border border-border">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            }

                            const { msg } = item;
                            const isUser = msg.role === "user";

                            return (
                                <div
                                    key={msg.id || i}
                                    className={`flex gap-3 max-w-3xl ${isUser ? "self-end flex-row-reverse" : "self-start"}`}
                                >
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center border border-border bg-surface">
                                        <span className="material-symbols-outlined text-lg text-primary-container">
                                            {isUser ? "person" : "smart_toy"}
                                        </span>
                                    </div>

                                    {/* Bubble */}
                                    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                                        <div
                                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-prose ${
                                                isUser
                                                    ? "bg-surface-tint-teal/20 border border-primary/30 rounded-tr-sm text-text-primary"
                                                    : "bg-surface border border-border rounded-tl-sm text-text-primary"
                                            }`}
                                        >
                                            {msg.content.split("\n").map((line, li) =>
                                                line ? (
                                                    <p key={li} className={li > 0 ? "mt-2" : ""}>
                                                        {line}
                                                    </p>
                                                ) : (
                                                    <br key={li} />
                                                )
                                            )}
                                        </div>
                                        {msg.created_at && (
                                            <span className="text-[10px] text-text-disabled px-1">
                                                {new Date(msg.created_at).toLocaleTimeString("en-US", {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* AI typing indicator */}
                    {sending && (
                        <div className="flex gap-3 max-w-3xl self-start">
                            <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center border border-border bg-surface">
                                <span className="material-symbols-outlined text-lg text-primary-container">smart_toy</span>
                            </div>
                            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                                {[0, 150, 300].map((delay) => (
                                    <div
                                        key={delay}
                                        className="w-2 h-2 rounded-full bg-text-secondary animate-bounce"
                                        style={{ animationDelay: `${delay}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div className="absolute bottom-0 md:bottom-0 w-full md:left-60 md:w-[calc(100%-240px)] bg-background border-t border-border p-4 md:p-6 mb-16 md:mb-0 z-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center bg-surface border border-border rounded-[10px] focus-within:border-primary/50 transition-colors">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message to Vero..."
                                disabled={sending}
                                className="flex-1 bg-transparent border-none text-text-primary text-sm placeholder-text-disabled focus:ring-0 px-4 py-4 outline-none disabled:opacity-60"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                className="m-2 p-2 bg-primary-container text-text-on-primary rounded-lg hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-text-disabled mt-2 hidden md:block">
                            AI can make mistakes. Always listen to your body.
                        </p>
                    </div>
                </div>

                {/* Mobile bottom nav */}
                <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-background border-t border-border z-50 flex items-center justify-around px-2">
                    {[
                        { to: "/dashboard", icon: "home", label: "Home" },
                        { to: "/workouts", icon: "fitness_center", label: "Workouts" },
                        { to: "/progress", icon: "leaderboard", label: "Progress" },
                        { to: "/chat", icon: "chat_bubble", label: "Chat", active: true },
                        { to: "/profile", icon: "person", label: "Profile" },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.to)}
                            className={`flex flex-col items-center justify-center w-16 h-full relative ${item.active ? "text-primary" : "text-text-secondary"}`}
                        >
                            {item.active && (
                                <div className="absolute -top-1 w-12 h-1 bg-primary rounded-b-full" />
                            )}
                            <span className="material-symbols-outlined mb-1">{item.icon}</span>
                            <span className="text-[10px]">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </main>
        </div>
    );
}