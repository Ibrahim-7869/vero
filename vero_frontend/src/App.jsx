import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Step1Safety from "./pages/onboarding/Step1Safety";
import Step2Goals from "./pages/onboarding/Step2Goals";
import Step3Logistics from "./pages/onboarding/Step3Logistics";
import Step4Training from "./pages/onboarding/Step4Training";
import Step5Lifestyle from "./pages/onboarding/Step5Lifestyle";
import Step6Nutrition from "./pages/onboarding/Step6Nutritions";
import { OnboardingProvider } from "./context/OnboardingContext";
import OnboardingGuard from "./components/OnboardingGuard";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ActiveWorkout from "./pages/ActiveWorkout";
import WorkoutComplete from "./pages/WorkoutComplete";
import WorkoutDetail from "./pages/WorkoutDetail";
import Progress from "./pages/Progress";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/onboarding/*"
            element={
              <OnboardingProvider>
                <OnboardingGuard>
                  <Routes>
                    <Route path="step1" element={<Step1Safety />} />
                    <Route path="step2" element={<Step2Goals />} />
                    <Route path="step3" element={<Step3Logistics />} />
                    <Route path="step4" element={<Step4Training />} />
                    <Route path="step5" element={<Step5Lifestyle />} />
                    <Route path="step6" element={<Step6Nutrition />} />
                  </Routes>
                </OnboardingGuard>
              </OnboardingProvider>
            }
          />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
          <Route path="/workout/session/:sessionId" element={<ProtectedRoute><ActiveWorkout /></ProtectedRoute>} />
          <Route path="/workout/complete/:sessionId" element={<ProtectedRoute><WorkoutComplete /></ProtectedRoute>} />
          <Route path="/workout/day/:dayId" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;