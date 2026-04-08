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
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/50"
        />

        <button
          onClick={handleSubmit}
          className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
        >
          {isLogin ? "Sign in" : "Sign up"}
        </button>

        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
          className="mt-4 text-sm text-cyan-200 hover:underline"
        >
          {isLogin ? "No account yet? Register." : "Already have an account? Log in."}
        </button>

        {message && (
          <div className="mt-4 break-words rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-200">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

