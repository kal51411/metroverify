import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { username: string; role: string; token: string }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("INSPECTOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        // Register user
        const regRes = await fetch("/api/v3/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            email,
            full_name: fullName || username,
            password,
            role
          })
        });

        if (!regRes.ok) {
          const errData = await regRes.json().catch(() => ({}));
          throw new Error(errData.detail || "Registration failed.");
        }
      }

      // Login to obtain JWT
      const loginRes = await fetch("/api/v3/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (!loginRes.ok) {
        const errData = await loginRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Invalid credentials.");
      }

      const data = await loginRes.json();
      localStorage.setItem("metro_token", data.access_token);
      localStorage.setItem("metro_user", JSON.stringify(data.user));

      onSuccess({
        username: data.user.username,
        role: data.user.role,
        token: data.access_token
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-3xl bg-[#111113]/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] p-6 sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>JWT & RBAC Security</span>
          </div>
          <h2 className="font-sans font-semibold text-2xl text-[#FAFAFA] tracking-tight">
            {isRegister ? "Create Metrology Account" : "Access MetroVerify"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isRegister ? "Register statutory authority or applicant profile." : "Enter credentials for Role-Based Access Control."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {isRegister && (
            <>
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer / Trader Name"
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-[#FAFAFA] outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@metroverify.gov.in"
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-[#FAFAFA] outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-[#FAFAFA] font-mono outline-none focus:border-cyan-500/50"
                >
                  <option value="INSPECTOR">INSPECTOR (Legal Metrology Officer)</option>
                  <option value="APPLICANT">APPLICANT (Weighbridge / Scale Trader)</option>
                  <option value="ADMIN">ADMIN (State Controller)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (e.g. inspector_demo)"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-[#FAFAFA] outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-sm text-[#FAFAFA] outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_25px_rgba(14,165,233,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? "Register & Sign In" : "Sign In to Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-zinc-400 hover:text-cyan-400 font-mono transition-colors"
          >
            {isRegister ? "Already registered? Sign in instead" : "Need an account? Register new user"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
