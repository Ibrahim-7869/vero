import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getActiveMealPlan, getDailyTotals, completeMeal, generateMealPlan } from "../api/nutrition";

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICONS = { breakfast: "light_mode", lunch: "lunch_dining", dinner: "dinner_dining", snack: "icecream" };
const FRACTIONS = { 0.25: "¼", 0.5: "½", 0.75: "¾", 1.5: "1½", 2.5: "2½" };

function getTodayDayNumber() {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

function fmtQty(q) {
  if (FRACTIONS[q]) return FRACTIONS[q];
  return Number.isInteger(q) ? String(q) : String(q);
}

function pluralize(unit, q) {
  if (q <= 1) return unit;
  if (unit.endsWith("s") || unit === "tbsp") return unit;
  if (unit === "pc") return "pcs";
  return unit + "s";
}

function portion(f) {
  const q = f.quantity;
  const s = (f.serving_size || "").trim();
  const m = s.match(/^([\d.]+)\s*(g|kg|ml)\b/i);
  if (m) return `${Math.round(parseFloat(m[1]) * q)} ${m[2].toLowerCase()}`;
  const unit = s.replace(/^1\s*/, "").trim() || "serving";
  return `${fmtQty(q)} ${pluralize(unit, q)}`;
}

function MacroBar({ label, value, target, color }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-text-secondary mb-1">
        <span>{label}</span>
        <span>{Math.round(value)} / {Math.round(target)}</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function NutritionDashboard() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [totals, setTotals] = useState(null);
  const [targets, setTargets] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setPlan((await getActiveMealPlan()).data); } catch { setPlan(null); }
    try {
      const t = (await getDailyTotals()).data;
      setTotals(t.totals); setTargets(t.targets); setCompleted(t.completed_meal_ids || []);
    } catch { }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const doGenerate = async () => { await generateMealPlan({ days: 7, include_cheat_day: true }); load(); };
  const doComplete = async (mealId) => {
    const today = new Date().toISOString().split("T")[0];
    await completeMeal({ meal_id: mealId, date: today });
    load();
  };

  if (loading) return <div className="bg-background min-h-screen flex items-center justify-center text-text-secondary">Loading...</div>;

  const todayDayNumber = getTodayDayNumber();
  const todayMeals = MEAL_ORDER
    .map((t) => (plan?.meals || []).find((m) => m.meal_type === t && m.day_number === todayDayNumber))
    .filter(Boolean);

  return (
    <div className="bg-background text-text-primary min-h-screen flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen p-5 md:p-10">
        <header className="mb-8">
          <p className="text-text-secondary mb-1">Your nutrition</p>
          <h2 className="text-4xl text-text-primary">Meal Plan</h2>
        </header>

        {!plan ? (
          <div className="bg-surface border border-border rounded-2xl p-10 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-5xl text-primary-container">restaurant</span>
            <p className="text-text-secondary">No meal plan yet. Generate one from your profile targets.</p>
            <button onClick={doGenerate} className="bg-primary-container text-text-on-primary px-6 py-3 rounded-[10px] font-medium hover:opacity-90">
              Generate My Meal Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {plan.has_cheat_day && (
              <div className="md:col-span-12 rounded-2xl border border-primary-container/30 bg-primary-container/10 p-4 text-primary-container text-sm flex items-center gap-2">
                <span className="material-symbols-outlined">celebration</span>
                Day {plan.cheat_day_number} is your optional cheat day — budget {plan.cheat_day_calories} kcal. Confirm any meal with your coach bot.
              </div>
            )}

            {/* Today's macros */}
            <div className="md:col-span-5 bg-surface border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-lg">Today's Intake</h3>
              <MacroBar label="Calories" value={totals?.calories || 0} target={targets?.calories || plan.target_calories} color="#7ae6c0" />
              <MacroBar label="Protein" value={totals?.protein || 0} target={targets?.protein || plan.target_protein_g} color="#5dcaa5" />
              <MacroBar label="Carbs" value={totals?.carbs || 0} target={targets?.carbs || plan.target_carbs_g} color="#f0b429" />
              <MacroBar label="Fats" value={totals?.fats || 0} target={targets?.fats || plan.target_fats_g} color="#e05a5a" />
            </div>

            {/* Today's meals */}
            <div className="md:col-span-7 bg-surface border border-border rounded-2xl p-5">
              <h3 className="text-lg mb-4">Today's Meals</h3>
              {todayMeals.length === 0 && <p className="text-text-secondary text-sm">No meals scheduled today.</p>}
              <div className="space-y-4">
                {todayMeals.map((m) => {
                  const done = completed.includes(m.id);
                  return (
                    <div key={m.id} className="border border-border rounded-xl p-4 bg-surface-container-low">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-primary-container capitalize text-sm font-medium">
                          <span className="material-symbols-outlined text-base">{MEAL_ICONS[m.meal_type]}</span>
                          {m.meal_type}
                        </span>
                        <button
                          onClick={() => !done && doComplete(m.id)}
                          disabled={done}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${done
                            ? "border-primary-container/40 text-primary-container bg-primary-container/10"
                            : "border-border text-text-secondary hover:bg-surface-container-high"}`}
                        >
                          <span className="material-symbols-outlined text-sm">{done ? "check_circle" : "radio_button_unchecked"}</span>
                          {done ? "Completed" : "Mark Completed"}
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {m.foods.map((f) => (
                          <li key={f.id} className="text-sm text-text-secondary flex justify-between">
                            <span>{portion(f)} {f.name}</span>
                            <span>{Math.round(f.calories * f.quantity)} cal</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Week strip */}
            <div className="md:col-span-12 bg-surface border border-border rounded-2xl p-5">
              <h3 className="text-lg mb-4">This Week</h3>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => {
                  const dn = i + 1;
                  const isToday = dn === todayDayNumber;
                  const dayMeals = (plan.meals || []).filter((m) => m.day_number === dn);
                  return (
                    <div key={dn} className={`flex flex-col items-center gap-1 p-2 rounded-xl border ${isToday ? "border-primary-container bg-primary-container/10" : "border-border bg-surface-container-low"}`}>
                      <span className="text-[10px] text-text-secondary">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</span>
                      <span className={`material-symbols-outlined text-lg ${isToday ? "text-primary-container" : "text-text-secondary"}`}>
                        {dayMeals.length ? "restaurant" : "self_improvement"}
                      </span>
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