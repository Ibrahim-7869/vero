import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../context/OnboardingContext";

const INJURY_OPTIONS = ["back", "knees", "shoulder", "others"]

export default function Step1Safety() {
    const { data, updateData } = useOnboarding();
    const navigate = useNavigate();

    const [selectedInjuries, setSelectedInjuries] = useState(
        data.has_injuries
            ? data.injury_details?.split(", ").filter(Boolean) || []
            : data.has_injuries === false
                ? ["none"]
                : []
    );

    const [takesMedication, setTakesMedication] = useState(
        data.takes_medication === true ? "yes" : data.takes_medication === false ? "no" : null
    );
    const [medicationDetails, setMedicationDetails] = useState(data.medication_details || "");

    const [hasDoctorRestriction, setHasDoctorRestriction] = useState(
        data.has_doctor_restriction === true ? "yes" : data.has_doctor_restriction === false ? "no" : null
    );
    const [doctorDetails, setDoctorDetails] = useState(data.doctor_restriction_details || "");

    function toggleInjury(value) {
        if (value === "none") {
            setSelectedInjuries(["none"]);
            return;
        }
        setSelectedInjuries((prev) => {
            const withoutNone = prev.filter((v) => v !== "none");
            if (withoutNone.includes(value)) {
                return withoutNone.filter((v) => v !== value);
            }
            return [...withoutNone, value];
        });
    }

    function handleContinue() {
        const hasInjuries = selectedInjuries.length > 0 && !selectedInjuries.includes("none");

        updateData({
            has_injuries: hasInjuries,
            injury_details: hasInjuries ? selectedInjuries.join(", ") : "",
            takes_medication: takesMedication === "yes",
            medication_details: takesMedication === "yes" ? medicationDetails : "",
            has_doctor_restriction: hasDoctorRestriction === "yes",
            doctor_restriction_details: hasDoctorRestriction === "yes" ? doctorDetails : "",
        });

        navigate("/onboarding/step2")
    }

    const canContinue =
        selectedInjuries.length > 0 &&
        takesMedication !== null &&
        hasDoctorRestriction !== null &&
        (takesMedication !== "yes" || medicationDetails.trim().length > 0) &&
        (hasDoctorRestriction !== "yes" || doctorDetails.trim().length > 0);

    return (
        <div className="flex flex-col min-h-screen bg-background text-text-primary">
            <header className="fixed top-0 w-full z-50 bg-background border-b border-border">
                <div className="flex flex-col w-full h-16">
                    <div className="flex items-center justify-between px-5 md:px-10 h-full w-full max-w-3xl mx-auto">
                        <button
                            aria-label="Go back"
                            className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors"
                            onClick={() => navigate("/login")}
                        >
                            <span className="material-symbols-outlined text-text-secondary hover:text-primary transition-colors">
                                arrow_back
                            </span>
                        </button>
                        <div className="text-lg font-bold text-text-primary">Step 1/6</div>
                        <div className="w-10" />
                    </div>
                    <div className="w-full h-1 bg-surface relative">
                        <div className="absolute top-0 left-0 h-full bg-primary-container" style={{ width: "17%" }} />
                    </div>
                </div>
            </header>

            <main className="grow flex flex-col justify-center items-center pt-24 pb-32 px-5 md:px-10 w-full max-w-2xl mx-auto">
                <div className="w-full mb-8 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl text-text-primary mb-4">Safety first.</h1>
                    <p className="text-lg text-text-secondary">
                        Before we build your plan, let's ensure it's safe for you to train.
                    </p>
                </div>

                <div className="w-full space-y-8 flex flex-col">
                    {/* Injuries */}
                    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
                        <label className="text-lg text-text-primary font-medium">
                            Current injuries or physical limitations
                        </label>
                        <p className="text-sm text-text-secondary -mt-3">Select all that apply.</p>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {INJURY_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggleInjury(opt)}
                                    className={`cursor-pointer flex items-center justify-center w-full p-3 border rounded-[10px] transition-colors text-sm capitalize ${selectedInjuries.includes(opt)
                                        ? "bg-surface-tint-teal border-primary-container text-text-primary"
                                        : "border-border text-text-secondary hover:border-text-disabled"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => toggleInjury("none")}
                            className={`cursor-pointer flex items-center justify-center w-full p-3 border rounded-[10px] transition-colors text-sm mt-2 ${selectedInjuries.includes("none")
                                ? "bg-surface-tint-teal border-primary-container text-text-primary"
                                : "border-border text-text-secondary hover:border-text-disabled"
                                }`}
                        >
                            None
                        </button>
                    </div>

                    {/* Medication */}
                    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
                        <label className="text-lg text-text-primary font-medium">
                            Are you taking medication for any chronic conditions?
                        </label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {["yes", "no"].map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setTakesMedication(opt)}
                                    className={`cursor-pointer flex items-center justify-center w-full p-3 border rounded-[10px] transition-colors text-sm capitalize ${takesMedication === opt
                                        ? "bg-surface-tint-teal border-primary-container text-text-primary"
                                        : "border-border text-text-secondary hover:border-text-disabled"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {takesMedication === "yes" && (
                            <div className="mt-2">
                                <label className="text-sm text-text-secondary" htmlFor="medDetails">
                                    Please specify
                                </label>
                                <textarea
                                    id="medDetails"
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-[10px] p-3 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder:text-text-secondary mt-1"
                                    placeholder="e.g. blood pressure medication"
                                    value={medicationDetails}
                                    onChange={(e) => setMedicationDetails(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Doctor restriction */}
                    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
                        <label className="text-lg text-text-primary font-medium">
                            Has a doctor ever restricted your exercise (e.g., heart condition, blood pressure)?
                        </label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {["yes", "no"].map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setHasDoctorRestriction(opt)}
                                    className={`cursor-pointer flex items-center justify-center w-full p-3 border rounded-[10px] transition-colors text-sm capitalize ${hasDoctorRestriction === opt
                                        ? "bg-surface-tint-teal border-primary-container text-text-primary"
                                        : "border-border text-text-secondary hover:border-text-disabled"
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                        {hasDoctorRestriction === "yes" && (
                            <div className="mt-2">
                                <label className="text-sm text-text-secondary" htmlFor="docDetails">
                                    Please specify
                                </label>
                                <textarea
                                    id="docDetails"
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-[10px] p-3 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary text-sm placeholder:text-text-secondary mt-1"
                                    placeholder="Briefly describe the restriction..."
                                    value={doctorDetails}
                                    onChange={(e) => setDoctorDetails(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 w-full z-40 bg-background/80 backdrop-blur-md border-t border-border px-5 py-4 flex justify-center">
                <div className="w-full max-w-3xl">
                    <button
                        type="button"
                        disabled={!canContinue}
                        onClick={handleContinue}
                        className="w-full bg-primary-container text-text-on-primary text-lg font-medium py-4 px-6 rounded-[10px] hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
