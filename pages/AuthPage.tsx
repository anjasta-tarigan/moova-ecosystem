import React, { useState, useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import Button from "../components/Button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Mail, Info, AlertCircle } from "lucide-react";
import { UserRole } from "../types";

const AuthPage: React.FC = () => {
  const { login } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign Up State
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    nationality: "Global",
    residence: "Global",
    dob: "",
    currentRole: "Researcher",
    institution: "",
    fieldOfInterest: "",
    educationLevel: "PhD",
    platformRole: "Participant",
    consentConduct: false,
    consentPrivacy: false,
    consentTerms: false,
  });

  useEffect(() => {
    if (location.pathname === "/join") {
      setIsLogin(false);
      setStep(1);
    } else {
      setIsLogin(true);
    }
    setError(null);
  }, [location.pathname]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error on type
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete(e);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes, signup defaults to participant view
    const mockUser = {
      id: "u-" + Date.now(),
      firstName: formData.firstName || "New",
      lastName: formData.lastName || "User",
      email: formData.email,
      role: "participant" as UserRole,
      organization: formData.institution || "New Member",
    };
    localStorage.setItem("giva_user", JSON.stringify(mockUser));
    navigate("/dashboard");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(formData.email, formData.password);
      const userStr = localStorage.getItem("giva_user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error("Login failed");
      if (user.role === "SUPERADMIN") {
        navigate("/superadmin");
      } else if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "JURI") {
        navigate("/dashboard/judge");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const SocialButton: React.FC<{ icon: string; label: string }> = ({
    icon,
    label,
  }) => (
    <button
      type="button"
      className="flex items-center justify-center gap-3 w-full py-3 px-4 border border-primary-200 rounded-xl text-primary-900 font-medium hover:bg-primary-50 hover:border-primary-300 hover:shadow-sm transition-all text-sm group"
    >
      <img
        src={icon}
        alt=""
        className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity"
      />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex w-full bg-white font-sans text-primary-900 selection:bg-secondary-100 selection:text-secondary-900">
      {/* LEFT PANEL: Branding (Desktop) - Dark Base */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-primary-900 flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Assets */}
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-20 pointer-events-none" />
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-primary-600/30 to-secondary-600/30 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 w-fit group">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center font-bold text-white group-hover:bg-white/20 transition-colors">
              G
            </div>
            <span className="font-bold text-xl tracking-tight">GIVA</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md animate-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Accelerating the{" "}
            <span className="text-transparent bg-clip-text bg-brand-gradient">
              velocity of science.
            </span>
          </h2>
          <p className="text-primary-100/70 text-lg leading-relaxed">
            Join the ecosystem where ideas evolve into impact through structured
            collaboration and global connectivity.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-300 mb-4">
            Supported By
          </p>
          <div className="flex gap-6 opacity-40 grayscale">
            {/* Geometric placeholders for logos */}
            <div className="h-6 w-20 bg-white/50 rounded"></div>
            <div className="h-6 w-20 bg-white/50 rounded"></div>
            <div className="h-6 w-20 bg-white/50 rounded"></div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Form */}
      <div className="flex-1 flex flex-col relative bg-white h-screen overflow-y-auto">
        {/* Mobile Header / Navigation */}
        <div className="flex justify-between items-center p-6 lg:p-12 absolute top-0 w-full z-20 pointer-events-none">
          <Link
            to="/"
            className="pointer-events-auto flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full border border-primary-200 flex items-center justify-center group-hover:border-primary-400 transition-colors bg-white shadow-sm">
              <ArrowLeft size={14} />
            </div>
            <span className="hidden sm:inline">Back to Landing Page</span>
          </Link>

          {/* Mobile Brand */}
          <div className="lg:hidden pointer-events-auto flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-24 w-full max-w-2xl mx-auto py-24">
          <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-bold text-primary-900 mb-3 tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-primary-900/60 text-lg mb-4">
              {isLogin
                ? "Please enter your credentials to access your dashboard."
                : "Join the ecosystem to start collaborating."}
            </p>

            {/* Account Toggle Link */}
            <div className="flex items-center gap-2 text-sm text-primary-600 font-medium bg-primary-50 p-3 rounded-lg border border-primary-100 w-fit">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Link
                to={isLogin ? "/join" : "/login"}
                className="text-secondary-500 hover:text-secondary-600 font-bold hover:underline transition-colors"
              >
                {isLogin ? "Join Now" : "Sign In"}
              </Link>
            </div>
          </div>

          {/* Progress Bar for Sign Up */}
          {!isLogin && (
            <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase text-primary-600 tracking-wider">
                  Step {step} of {totalSteps}
                </span>
                <span className="text-xs font-bold uppercase text-primary-400 tracking-wider">
                  •{" "}
                  {step === 1 ? "Identity" : step === 2 ? "Background" : "Role"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-primary-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-gradient transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="animate-in slide-in-from-bottom-4 duration-700 delay-200">
            {/* Login Flow */}
            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                {/* Dev Hint */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500">
                  <strong>Test Accounts:</strong>
                  <br />
                  siswa@giva.test / siswa123 (Student)
                  <br />
                  juri1@giva.test / juri123 (Judge)
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-bold uppercase text-primary-500 mb-1.5 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail
                      className="absolute left-4 top-3.5 text-primary-400 group-focus-within:text-primary-600 transition-colors"
                      size={18}
                    />
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium text-primary-900 placeholder:text-primary-300"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1.5 ml-1">
                    <label className="text-xs font-bold uppercase text-primary-500">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-xs font-bold text-secondary-500 hover:text-secondary-600 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-3.5 text-primary-400 group-focus-within:text-primary-600 transition-colors"
                      size={18}
                    />
                    <input
                      required
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium text-primary-900 placeholder:text-primary-300"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={loading}
                  className="mt-4 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all transform hover:-translate-y-0.5"
                >
                  {loading ? "Verifying Credentials..." : "Sign In"}
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-primary-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-primary-400 font-bold tracking-wider">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SocialButton
                    icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                    label="Google"
                  />
                  <SocialButton
                    icon="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                    label="Microsoft"
                  />
                </div>
              </form>
            ) : (
              // Sign Up Flow
              <form onSubmit={handleNext} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-primary-500 ml-1">
                          First Name
                        </label>
                        <input
                          required
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          type="text"
                          className="w-full px-4 py-3 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                          placeholder="Jane"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-primary-500 ml-1">
                          Last Name
                        </label>
                        <input
                          required
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          type="text"
                          className="w-full px-4 py-3 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-primary-500 ml-1">
                        Email
                      </label>
                      <input
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email"
                        className="w-full px-4 py-3 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-primary-500 ml-1">
                        Password
                      </label>
                      <input
                        required
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        type="password"
                        className="w-full px-4 py-3 bg-primary-50/50 border border-primary-100 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="Min. 8 chars"
                      />
                    </div>

                    <div className="pt-6 mt-6 border-t border-primary-100">
                      <p className="text-xs text-center text-primary-400 mb-4 font-medium uppercase tracking-wide">
                        Or register via SSO
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <SocialButton
                          icon="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                          label="Google"
                        />
                        <SocialButton
                          icon="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                          label="Microsoft"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="p-8 bg-primary-50/50 rounded-xl border border-primary-200 text-center border-dashed">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-primary-400">
                        <Info size={24} />
                      </div>
                      <h3 className="text-primary-900 font-bold text-sm mb-1">
                        Academic Background
                      </h3>
                      <p className="text-sm text-primary-500">
                        This section would contain fields for Institution,
                        Education Level, and Field of Interest.
                      </p>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="p-8 bg-primary-50/50 rounded-xl border border-primary-200 text-center border-dashed">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-primary-400">
                        <Info size={24} />
                      </div>
                      <h3 className="text-primary-900 font-bold text-sm mb-1">
                        Role Selection
                      </h3>
                      <p className="text-sm text-primary-500">
                        This section would confirm your primary role
                        (Researcher, Founder, etc.) and collect legal consents.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="w-1/3"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    disabled={loading}
                    className="flex-1 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
                  >
                    {loading
                      ? "Processing..."
                      : step === totalSteps
                        ? "Complete Registration"
                        : "Continue"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Links (Mobile/Tablet only shown at bottom) */}
        <div className="p-6 lg:px-12 text-center lg:text-left border-t border-primary-50 lg:border-none">
          <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-xs text-primary-400 font-medium">
            <Link
              to="/privacy"
              className="hover:text-primary-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-primary-600 transition-colors"
            >
              Terms of Service
            </Link>
            <span>© {new Date().getFullYear()} GIVA Ecosystem</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
