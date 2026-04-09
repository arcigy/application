"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { normalizeUserSlug } from "@/lib/user-slug";

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "password">("email");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetShowPassword, setResetShowPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession();
      if (data?.user) {
        const urlSafeName = normalizeUserSlug(data.user.name);
        router.push(`/${urlSafeName}/dashboard`);
      }
    };

    void checkSession();
  }, [router]);

  const handleSubmit = async () => {
    setMessage("Working...");
    try {
      if (isLogin) {
        const { data, error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          setMessage(`Error: ${error.message}`);
        } else if (data?.user) {
          const urlSafeName = normalizeUserSlug(data.user.name);
          router.push(`/${urlSafeName}/dashboard`);
        }
      } else {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) {
          setMessage(`Error: ${error.message}`);
        } else if (data?.user) {
          const urlSafeName = normalizeUserSlug(data.user.name);
          router.push(`/${urlSafeName}/dashboard`);
        }
      }
    } catch {
      setMessage("Unexpected error.");
    }
  };

  const startReset = async () => {
    if (!resetEmail) return setMessage("Enter email first.");
    setResetStep("password");
    setMessage("");
  };

  const submitReset = async () => {
    setMessage("Resetting password...");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resetEmail,
        newPassword,
        confirmPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error || "Reset failed");
      return;
    }
    setMessage("Password changed.");
    setResetOpen(false);
    setResetStep("email");
    setResetEmail("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-zinc-50 sm:p-12">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.4)] backdrop-blur">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Arcigy
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Custom automation dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Sign in to open your assigned workspace and automation modules.
          </p>
        </div>

        <p className="mb-4 text-center text-sm text-zinc-300">
          {isLogin ? "Log in to your account" : "Create a new account"}
        </p>

        {!isLogin && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/50"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/50"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 pr-20 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-200 hover:underline"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
        >
          {isLogin ? "Sign in" : "Sign up"}
        </button>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
            className="text-sm text-cyan-200 hover:underline"
          >
            {isLogin ? "No account yet? Register." : "Already have an account? Log in."}
          </button>
          {isLogin && (
            <button
              onClick={() => setResetOpen(true)}
              className="text-sm text-cyan-200 hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>

        {message && (
          <div className="mt-4 break-words rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-200">
            {message}
          </div>
        )}
      </div>

      {resetOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 p-6">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">Reset password</h2>
            <p className="mt-2 text-sm text-slate-300">
              {resetStep === "email"
                ? "Enter your email to continue."
                : "Set your new password twice."}
            </p>

            {resetStep === "email" ? (
              <div className="mt-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none"
                />
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setResetOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Close
                  </button>
                  <button
                    onClick={startReset}
                    className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <input
                    type={resetShowPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 pr-20 text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setResetShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-200 hover:underline"
                  >
                    {resetShowPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={resetShowPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setResetStep("email")}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={submitReset}
                    className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
                  >
                    Save new password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
