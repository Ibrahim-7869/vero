import { createContext, useContext, useState } from "react";

const OnboardingContext = createContext(null);

const initialData = {
    has_injuries: null,
    injury_details: "",
    takes_medication: null,
    medication_details: "",
    has_doctor_restriction: null,
    doctor_restriction_details: "",
    primary_goal: "",
    success_vision: "",
    success_vision_other: "",
    body_type: "",
    build_template_id: null,   // ← NEW (replaces body_type)
    equipment: [],
    time_per_session: null,
    days_per_week: null,
    training_style: "",
    workout_focus: "",
    experience_level: "",
    sleep_hours: null,
    stress_level: null,
    smokes_or_drinks: null,
    eating_habits: "",
    dietary_restriction: "",
    cuisine_preference: "",
};

export function OnboardingProvider({ children }) {
    const [data, setData] = useState(() => {
        const bio = sessionStorage.getItem("onboarding_biometrics");
        const biometrics = bio ? JSON.parse(bio) : {};
        return { ...initialData, ...biometrics };
    });

    function updateData(fields) {
        setData((prev) => ({ ...prev, ...fields }));
    }

    return (
        <OnboardingContext.Provider value={{ data, updateData }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    return useContext(OnboardingContext)
}