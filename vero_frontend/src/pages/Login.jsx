import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeQuote, setActiveQuote] = useState(0);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveQuote((current) => (current + 1) % motivationQuotes.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.detail || "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const currentQuote = motivationQuotes[activeQuote];

  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="flex w-full min-h-screen">
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
                  className={`h-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    index === activeQuote ? "w-8 bg-primary-container" : "w-2 bg-text-primary/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-5 lg:p-10 bg-background">
          <div className="w-full max-w-md flex flex-col space-y-8">
            <div className="flex flex-col space-y-6">
              <div className="text-2xl font-bold text-primary">Vero</div>
              <h1 className="text-3xl text-text-primary">Welcome back</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              <div className="space-y-2">
                <label className="block text-sm text-text-primary" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-text-secondary text-lg">mail</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-surface text-text-primary placeholder-text-disabled focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-colors outline-none"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-text-primary" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-text-secondary text-lg">lock</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-surface text-text-primary placeholder-text-disabled focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-colors outline-none"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-border bg-surface text-primary-container"
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="ml-2 block text-sm text-text-secondary" htmlFor="remember-me">
                    Remember me for 30 days
                  </label>
                </div>
                <a className="text-sm text-primary-container hover:text-primary transition-colors" href="#">
                  Forgot password?
                </a>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                className="w-full flex justify-center py-3 px-4 rounded-[10px] bg-primary-container text-text-on-primary font-medium hover:opacity-90 transition-all disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-text-secondary">
                Don't have an account?{" "}
                <Link className="text-primary-container hover:text-primary transition-colors font-medium" to="/signup">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}