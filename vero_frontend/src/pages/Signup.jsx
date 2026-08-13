import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup, login, getCurrentUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [activeQuote, setActiveQuote] = useState(0);
  const motivationQuotes = [
    {
      title: "Embrace the quiet effort.",
      body: "Consistent, focused progress without the noise. Your daily wellness anchor.",
    },
    {
      title: "Small steps still move you forward.",
      body: "Momentum comes from showing up, even when the day feels ordinary.",
    },
    {
      title: "Progress is built in repetition.",
      body: "The strongest routines are the ones you can return to with patience.",
    },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return;
    }
    if (password.length < 8) {
      setError("Password must be atleast 8 characters.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const usernameBase = fullName.trim().toLowerCase().replace(/\s+/g, "_") || "user";
      const username = `${usernameBase}_${Math.floor(Math.random() * 10000)}`;

      await signup(username, fullName.trim(), email, password);
      await login(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      sessionStorage.setItem("onboarding_biometrics", JSON.stringify({
        age: parseInt(age),
        gender,
        height_cm: parseFloat(height),
        weight_kg: parseFloat(weight),
      }));

      navigate("/onboarding/step1")
    } catch (err) {
      const data = err.response?.data;
      let message = "Signup failed. Please try again.";
      if (data) {
        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          message = data[firstKey][0];
        }
      }
      setError(message);
    } finally {
      setLoading(false)
    }

  }
  const currentQuote = motivationQuotes[activeQuote];

  return (
    <div className="bg-background text-text-primary min-h-screen w-full flex overflow-hidden">
      {/* Left Panel: Image & Tagline */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen relative bg-surface-dim overflow-hidden">
        <img
          alt="Vero Fitness Background"
          className="absolute inset-0 w-full h-full object-cover animate-[slowzoom_20s_ease-out_forwards]"
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZXhlcmNpc2V8ZW58MHx8MHx8fDA%3D"
        />
        <div className="absolute inset-0 bg-linear-to-t from-transparent via-background/50 to-background/90" />
        <div className="absolute inset-0 shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.45)] pointer-events-none" />

        <div className="absolute top-10 left-10 z-20 animate-[fadeup_0.8s_ease-out_forwards] opacity-0">
          <div className="text-2xl font-bold text-primary">Vero</div>
        </div>

        <div className="relative z-10 flex flex-col justify-end p-10 w-full max-w-2xl mx-auto h-full pb-24">
          <div className="animate-[fadeup_0.9s_ease-out_0.1s_forwards] opacity-0 mb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary-container/80">
              Daily Motivation
            </span>
          </div>

          <div className="animate-[fadeup_0.9s_ease-out_0.2s_forwards] opacity-0 w-12 h-1 bg-primary-container rounded-full mb-6" />

          <div className="min-h-40 flex flex-col justify-start overflow-hidden">
            <div className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
              <p className="text-4xl font-semibold text-text-primary max-w-lg leading-tight mb-3">
                {currentQuote.title}
              </p>

              <p className="text-lg font-normal text-text-primary/70 max-w-lg leading-relaxed">
                {currentQuote.body}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-8 opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
            {motivationQuotes.map((quote, index) => (
              <button
                key={quote.title}
                type="button"
                aria-label={`Show quote ${index + 1}`}
                onClick={() => setActiveQuote(index)}
                className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${index === activeQuote ? "w-8 bg-primary-container" : "w-2 bg-text-primary/30"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Right Panel */}
      <div className="w-full h-auto lg:w-1/2 overflow-y-auto flex items-center justify-center p-5 md:p-10 bg-background relative z-10">
        <div className="absolute top-8 left-5 lg:hidden">
          <span className="text-2xl text-primary font-bold">Vero</span>
        </div>

        <div className="w-full max-w-105 mt-12 lg:mt-0">
          <div className="mb-8">
            <h2 className="text-3xl text-text-primary mb-2">Create your account</h2>
            <p className="text-text-secondary">Start your focused journey today.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary ml-1" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">
                  person
                </span>
                <input
                  className="w-full bg-surface border border-border rounded-[10px] py-3 pl-10 pr-4 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="fullName"
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">
                  mail
                </span>
                <input
                  className="w-full bg-surface border border-border rounded-[10px] py-3 pl-10 pr-4 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="email"
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">
                  lock
                </span>
                <input
                  className="w-full bg-surface border border-border rounded-[10px] py-3 pl-10 pr-4 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary ml-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none text-[20px]">
                  lock
                </span>
                <input
                  className="w-full bg-surface border border-border rounded-[10px] py-3 pl-10 pr-4 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Biometrics */}
            <div className="flex items-start mt-2 mb-2">
              <span className="text-xs text-text-secondary ml-1">
                Tell us about yourself (for personalized coaching)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary ml-1" htmlFor="age">Age</label>
                <input
                  className="w-full bg-surface border border-border rounded-[10px] py-3 px-4 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="age"
                  type="number"
                  min="13"
                  max="100"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary ml-1" htmlFor="gender">Gender</label>
                <select
                  className="w-full bg-surface border border-border rounded-[10px] py-3 px-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary ml-1" htmlFor="height">Height (cm)</label>
                <input
                  className="w-full bg-surface border border-border rounded-[10px] py-3 px-4 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="height"
                  type="number"
                  min="100"
                  max="250"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary ml-1" htmlFor="weight">Weight (kg)</label>
                <input
                  className="w-full bg-surface border border-border rounded-[10px] py-3 px-4 text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  id="weight"
                  type="number"
                  min="30"
                  max="300"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-start mt-2 mb-2">
              <div className="flex items-center h-5">
                <input
                  className="w-4 h-4 rounded-sm bg-surface border border-border text-primary-container cursor-pointer"
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
              </div>
              <label className="ml-3 text-text-secondary cursor-pointer select-none" htmlFor="terms">
                I agree to the{" "}
                <a className="text-primary hover:text-primary-container underline decoration-primary/30 underline-offset-2" href="#">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-primary hover:text-primary-container underline decoration-primary/30 underline-offset-2" href="#">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              className="w-full bg-primary-container text-text-on-primary font-medium py-3.5 px-6 rounded-[10px] hover:bg-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}</span>
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-text-secondary">
              Already have an account?{" "}
              <Link className="text-primary font-medium hover:text-primary-container ml-1" to="/login">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}