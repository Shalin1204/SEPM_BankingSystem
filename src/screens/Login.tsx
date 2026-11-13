import { useState } from "react";
import type { Screen } from "../App";
import { api } from "../api/client";

interface Props {
  navigate: (s: Screen) => void;
  onLoginSuccess?: (user: any) => void;
}

export default function Login({ navigate, onLoginSuccess }: Props) {
  const [email, setEmail] = useState("admin@sbi.co.in");
  const [password, setPassword] = useState("Password@123");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.login(email.trim(), password);
      if (onLoginSuccess && res.user) {
        onLoginSuccess(res.user);
      }
      navigate("dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (uEmail: string) => {
    setEmail(uEmail);
    setPassword("Password@123");
    setError(null);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d1f35] flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(#4b83c7 1px, transparent 1px), linear-gradient(90deg, #4b83c7 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 bg-[#2563eb] rounded flex items-center justify-center text-white font-bold text-lg">B</div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Banking Transaction</p>
              <p className="text-white/60 text-xs">Tracking System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
              Secure Transaction<br />Monitoring Platform
            </h2>
            <p className="text-white/55 text-sm leading-relaxed">
              Monitor transactions in real-time, detect fraudulent activity, and manage investigations — all from a single unified interface.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "⚡", label: "Real-time Fraud Detection", desc: "Automated trigger & rules-based detection" },
              { icon: "🔒", label: "AML & Security Compliance", desc: "Suspicious activity monitoring and blocked merchant filtering" },
              { icon: "📊", label: "Analytics & Reporting", desc: "Comprehensive volume and fraud trend analysis" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded bg-white/5 border border-white/10">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{f.label}</p>
                  <p className="text-white/45 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <span>🏛</span>
            <span>State Bank of India — Internal Banking Security Platform</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile Brand */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[#2563eb] rounded flex items-center justify-center text-white font-bold">B</div>
            <span className="font-semibold text-gray-900 text-sm">Banking Transaction Tracking System</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h1>
            <p className="text-gray-500 text-sm">Enter your credentials to access the security dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-start gap-2">
              <span className="text-red-500 font-bold">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email / Employee ID</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sbi.co.in"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#2563eb]"
                />
                <span className="text-xs text-gray-600">Remember me for 8 hours</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Credentials Quick Switcher */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
            <p className="font-semibold text-gray-700 mb-1.5 text-[11px]">Demo Accounts (Password: Password@123):</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Admin", email: "admin@sbi.co.in" },
                { label: "Investigator", email: "amit.joshi@sbi.co.in" },
                { label: "Analyst", email: "neha.tiwari@sbi.co.in" },
              ].map(d => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => handleQuickFill(d.email)}
                  className="px-2 py-1 bg-white border border-gray-300 hover:border-blue-500 hover:text-blue-600 text-gray-600 rounded text-[10px] transition-colors"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-green-500">🔒</span>
              <span>Your connection is secured with 256-bit TLS encryption</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
              <span>🛡</span>
              <span>Protected by multi-factor authentication &amp; IP whitelisting</span>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-gray-400">
            Internal Banking Security Platform · Connected to MySQL fraud_detection_db
          </p>
        </div>
      </div>
    </div>
  );
}
