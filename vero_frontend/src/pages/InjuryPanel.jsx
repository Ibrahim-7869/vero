import { useEffect, useState } from "react";
import { getInjuries, reportInjury, respondToCheckIn } from "../api/health";

const BODY_PARTS = ["knee", "shoulder", "lower_back", "ankle", "wrist", "neck", "elbow", "hip"];
const RESPONSES = [
    { value: "fully_recovered", label: "Fully recovered", icon: "check_circle" },
    { value: "partially_recovered", label: "Better", icon: "trending_up" },
    { value: "same", label: "Same", icon: "remove" },
    { value: "worse", label: "Worse", icon: "trending_down" },
];

export default function InjuryPanel() {
    const [data, setData] = useState({ injuries: [], due_check_ins: [] });
    const [bodyPart, setBodyPart] = useState("knee");
    const [severity, setSeverity] = useState("moderate");
    const [description, setDescription] = useState("");
    const [doctorDays, setDoctorDays] = useState("");
    const [busy, setBusy] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const load = () => getInjuries().then((r) => setData(r.data)).catch(() => {});
    useEffect(() => { load(); }, []);

    async function report(e) {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = { body_part: bodyPart, severity, description };
            if (doctorDays) payload.doctor_rest_days = parseInt(doctorDays, 10);
            await reportInjury(payload);
            setDescription("");
            setDoctorDays("");
            setShowForm(false);
            load();
        } finally { setBusy(false); }
    }

    return (
        <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container">healing</span>
                    <h4 className="text-lg text-text-primary">Injury & Recovery</h4>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => setShowForm(true)}
                        className="text-xs bg-surface-container-high text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-full transition-colors"
                    >
                        + Report Injury
                    </button>
                )}
            </div>

            {/* Check-in Prompts */}
            {data.due_check_ins.map((ci) => (
                <div key={ci.id} className="mb-4 bg-primary-container/10 border border-primary-container/30 rounded-lg p-4">
                    <p className="text-sm text-text-primary mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-container text-base">healing</span>
                        Check-in due: How is your <span className="capitalize font-medium">{ci.injury_body_part?.replace("_", " ")}</span>?
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {RESPONSES.map((r) => (
                            <button 
                                key={r.value} 
                                onClick={() => respondToCheckIn(ci.id, { user_response: r.value }).then(load)}
                                className="text-xs px-3 py-2 rounded-lg border border-border bg-surface text-text-secondary hover:bg-surface-container-high hover:text-text-primary flex items-center gap-1.5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">{r.icon}</span>
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Active Injuries */}
            {data.injuries.map((inj) => (
                <div key={inj.id} className="mb-3 flex justify-between items-center bg-background rounded-lg p-3 border border-border">
                    <div>
                        <p className="text-sm text-text-primary capitalize">{inj.body_part.replace("_", " ")} — {inj.severity}</p>
                        <p className="text-xs text-text-secondary">Expected recovery: {inj.expected_recovery_date}</p>
                    </div>
                    <span className="text-xs text-primary-container capitalize bg-primary-container/10 px-2 py-1 rounded">
                        {inj.status.replace("_", " ")}
                    </span>
                </div>
            ))}

            {/* Report Form */}
            {showForm && (
                <form onSubmit={report} className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Body Part</label>
                            <select 
                                value={bodyPart} 
                                onChange={(e) => setBodyPart(e.target.value)}
                                className="w-full bg-background border border-border rounded-[10px] py-2 px-3 text-sm text-text-primary capitalize"
                            >
                                {BODY_PARTS.map((b) => <option key={b} value={b}>{b.replace("_", " ")}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">Severity</label>
                            <select 
                                value={severity} 
                                onChange={(e) => setSeverity(e.target.value)}
                                className="w-full bg-background border border-border rounded-[10px] py-2 px-3 text-sm text-text-primary capitalize"
                            >
                                <option value="mild">Mild</option>
                                <option value="moderate">Moderate</option>
                                <option value="severe">Severe</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-text-secondary mb-1">Doctor's prescribed rest days (optional)</label>
                        <input 
                            type="number" 
                            min="1"
                            value={doctorDays} 
                            onChange={(e) => setDoctorDays(e.target.value)} 
                            placeholder="Leave empty for system calculation"
                            className="w-full bg-background border border-border rounded-[10px] py-2 px-3 text-sm text-text-primary" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-text-secondary mb-1">What happened?</label>
                        <input 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="e.g. Felt a sharp pain during squats"
                            className="w-full bg-background border border-border rounded-[10px] py-2 px-3 text-sm text-text-primary" 
                        />
                    </div>
                    
                    <div className="flex gap-2 justify-end mt-1">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="text-text-secondary text-sm px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button 
                            disabled={busy} 
                            className="bg-primary-container text-text-on-primary text-sm px-5 py-2 rounded-[10px] disabled:opacity-50"
                        >
                            {busy ? "Adjusting plan..." : "Report & Adjust Plan"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}