"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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

  if (loading) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold">Welcome, {sessionName || userName}</h1>
          <p className="mt-3 text-sm text-slate-300">One automation is attached to this account.</p>
          <div className="mt-6">
            <Link
              href={`/${userName}/dashboard/cold-outreach`}
              className="inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Open cold_outreach
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

