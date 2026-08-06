import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOnboardingProfile } from "../api/onboarding";

export default function OnboardingGuard({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [checking, setChecking] = useState(true);
    const [alreadyCompleted, setAlreadyCompleted] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setChecking(false);
            return;
        }

        async function checkStatus() {
            try {
                await getOnboardingProfile();
                setAlreadyCompleted(true);
            }  catch (err) {
                if (err.response?.status === 404) {
                    setAlreadyCompleted(false);
                } else {
                    console.error("Onboarding status check failed:", err);
                    setAlreadyCompleted(false);
                }
            } finally {
            setChecking(false);
        }
    }
    checkStatus();
}, [user, authLoading]);

if (authLoading || checking) {
    return (
        <div className="bg-background min-h-screen flex items-center justify-center text-text-secondary">
            Loading...
        </div>
    );
}

if (!user) {
    return <Navigate to="/login" replace />;
}

if (alreadyCompleted) {
    return (
        <div className="bg-background min-h-screen flex items-center justify-center text-text-primary">
            <Navigate to ="/dashboard" replace/>
        </div>
    );
}

return children;
}