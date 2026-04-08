"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getAutomationsForUser } from "@/automations/registry";
import { normalizeUserSlug } from "@/lib/user-slug";

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  const userName = String(params.user ?? "");
  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await authClient.getSession();

      if (error || !data?.user) {
        router.push("/");
        return;
      }

      const normalizedSessionName = normalizeUserSlug(data.user.name);
      if (normalizedSessionName !== normalizeUserSlug(userName)) {
        router.replace(`/${normalizedSessionName}/dashboard`);
        return;
      }

      setSessionName(data.user.name);
      setLoading(false);
    };

    void checkSession();
  }, [router, userName]);

  const automations = sessionName ? getAutomationsForUser(sessionName) : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-xl">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Welcome back, {sessionName || userName}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                This space shows the automation assigned to your account and
                keeps the frontend aligned with the backend flow you already
                have running.
              </p>
            </div>

            <button
              onClick={async () => {
                await authClient.signOut();
                router.push("/");
              }}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
            >
              Sign out
            </button>
          </div>
        </header>

        {automations.length > 0 ? (
          <div className="space-y-6">
            {automations.map((automation) => {
              const AutomationComponent = automation.component;
              return (
                <AutomationComponent key={automation.slug} data={automation.data} />
              );
            })}
          </div>
        ) : (
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
            <h2 className="text-2xl font-semibold text-white">
              No active automations yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Your account is authenticated, but there is no frontend module
              assigned to this user yet. If you want, we can add another
              automation card the same way as the lead scraping pipeline.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

