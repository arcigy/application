"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { normalizeUserSlug } from "@/lib/user-slug";

export default function ColdOutreachPage() {
  const params = useParams();
  const router = useRouter();
  const userName = String(params.user ?? "");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [profession, setProfession] = useState("");
  const [maxCount, setMaxCount] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await authClient.getSession();
      if (!data?.user) return router.push("/");
      if (normalizeUserSlug(data.user.name) !== normalizeUserSlug(userName)) {
        return router.replace(`/${normalizeUserSlug(data.user.name)}/dashboard`);
      }
      setLoading(false);
    };
    void checkSession();
  }, [router, userName]);

  const runAutomation = async () => {
    setRunning(true);
    setMessage("Running...");
    const res = await fetch("/api/automations/cold-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        profession,
        maxCount: maxCount ? Number(maxCount) : undefined,
        location: location || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Started" : data?.error || "Failed");
    setRunning(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">cold_outreach</p>
          <h1 className="mt-3 text-3xl font-semibold">Lead discovery + enrichment</h1>
          <p className="mt-3 text-sm text-slate-300">
            Set the keyword, profession, location, and max count.
          </p>

          <div className="mt-6 grid gap-4">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none" />
            <input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Profession" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none" />
            <input value={maxCount} onChange={(e) => setMaxCount(e.target.value)} placeholder="Max count" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none" />
          </div>

          <button
            onClick={runAutomation}
            disabled={running}
            className="mt-6 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {running ? "Running..." : "Start automation"}
          </button>

          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
        </div>
      </div>
    </div>
  );
}
