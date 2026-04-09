"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { normalizeUserSlug } from "@/lib/user-slug";

type Run = {
  id: string;
  status: string;
  current_step: string;
  discovered_count: number;
  enriched_count: number;
  sent_count: number;
  lead_count: number;
  keyword: string;
  profession: string;
  location: string | null;
  max_count: number | null;
  error: string | null;
};

type LeadRow = {
  website: string;
  original_name: string | null;
  company_name_short: string | null;
  official_company_name: string | null;
  decision_maker_name: string | null;
  decision_maker_last_name: string | null;
  primary_email: string | null;
  ico: string | null;
  address: string | null;
  verification_status: string | null;
  verification_notes: string | null;
  sent_to_smartlead: boolean | null;
  updated_at: string;
};

export default function ColdOutreachPage() {
  const params = useParams();
  const router = useRouter();
  const userName = String(params.user ?? "");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"all" | "discovery" | "enrich" | "inject">("all");
  const [keyword, setKeyword] = useState("");
  const [profession, setProfession] = useState("");
  const [maxCount, setMaxCount] = useState("");
  const [location, setLocation] = useState("");
  const [runId, setRunId] = useState("");
  const [run, setRun] = useState<Run | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);

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

  useEffect(() => {
    if (!runId) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/automations/cold-outreach?runId=${runId}&include=leads`);
      const data = await res.json().catch(() => ({}));
      if (data?.data?.run) setRun(data.data.run);
      if (data?.data?.leads) setLeads(data.data.leads);
    }, 2000);
    return () => clearInterval(timer);
  }, [runId]);

  const start = async () => {
    setRunning(true);
    setMessage("Spúšťam...");
    const res = await fetch("/api/automations/cold-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        mode,
        keyword,
        profession,
        maxCount: maxCount ? Number(maxCount) : undefined,
        location: location || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.runId) {
      setRunId(data.data.runId);
      setMessage("Beh je spustený.");
    } else {
      setMessage(data?.error || "Failed");
    }
    setRunning(false);
  };

  const continueRun = async (nextMode: "discovery" | "enrich" | "inject") => {
    if (!runId) return;
    setRunning(true);
    const res = await fetch("/api/automations/cold-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "continue", runId, mode: nextMode }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? `Pokračujem: ${nextMode}` : data?.error || "Failed");
    setRunning(false);
  };

  const control = async (action: "pause" | "cancel") => {
    if (!runId) return;
    await fetch("/api/automations/cold-outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, runId }),
    });
    setMessage(action === "pause" ? "Pozastavené." : "Zrušené.");
  };

  const nextStep = useMemo(() => {
    if (!run) return null;
    if (run.current_step === "discovery_done") return "enrich";
    if (run.current_step === "enrichment_done") return "inject";
    return null;
  }, [run]);

  if (loading) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">cold_outreach</p>
          <h1 className="mt-3 text-3xl font-semibold">Lead discovery + enrichment pipeline</h1>
          <p className="mt-3 text-sm text-slate-300">Spusť celý flow naraz alebo iba jednotlivé kroky, sleduj priebežné dopĺňanie leadov v tabuľke.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white">
              <option value="all">Spustiť všetko naraz</option>
              <option value="discovery">Iba discovery</option>
              <option value="enrich">Discovered {"->"} enrich</option>
              <option value="inject">Enriched {"->"} inject</option>
            </select>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none" />
            <input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Profession" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none" />
            <input value={maxCount} onChange={(e) => setMaxCount(e.target.value)} placeholder="Max count" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white outline-none md:col-span-2" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={start} disabled={running} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60">Start</button>
            <button onClick={() => nextStep && continueRun(nextStep)} disabled={!nextStep || running} className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40">Continue</button>
            <button onClick={() => control("pause")} disabled={!runId} className="rounded-full border border-white/15 px-4 py-2 text-sm disabled:opacity-40">Pause</button>
            <button onClick={() => control("cancel")} disabled={!runId} className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-200 disabled:opacity-40">Cancel</button>
          </div>

          {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
          {run && (
            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <div>Status: <span className="text-white">{run.status}</span></div>
              <div>Step: <span className="text-white">{run.current_step}</span></div>
              <div>Discovered: <span className="text-white">{run.discovered_count}</span></div>
              <div>Enriched: <span className="text-white">{run.enriched_count}</span></div>
              <div>Sent: <span className="text-white">{run.sent_count}</span></div>
              <div>Lead count: <span className="text-white">{run.lead_count}</span></div>
              {run.error && <div className="md:col-span-2 text-rose-300">Error: {run.error}</div>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Live leads</h2>
            <div className="text-sm text-slate-400">{leads.length} rows</div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-2">Company</th>
                  <th className="px-3 py-2">Decision maker</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">ICO</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Sent</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.website} className="border-t border-white/5">
                    <td className="px-3 py-2 text-white">{lead.official_company_name || lead.company_name_short || lead.original_name || lead.website}</td>
                    <td className="px-3 py-2">{lead.decision_maker_name || "-"}</td>
                    <td className="px-3 py-2">{lead.primary_email || "-"}</td>
                    <td className="px-3 py-2">{lead.ico || "-"}</td>
                    <td className="px-3 py-2">{lead.verification_status || "-"}</td>
                    <td className="px-3 py-2">{lead.sent_to_smartlead ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
