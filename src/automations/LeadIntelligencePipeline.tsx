"use client";

type Badge = {
  label: string;
  tone: "neutral" | "success" | "warning";
};

type Metric = {
  label: string;
  value: string;
};

type Field = {
  label: string;
  description: string;
};

type Step = {
  title: string;
  description: string;
};

export type LeadIntelligencePipelineData = {
  title: string;
  description: string;
  assignedTo: string;
  status: string;
  badges: Badge[];
  metrics: Metric[];
  inputs: Field[];
  outputs: Field[];
  steps: Step[];
};

const badgeToneClasses: Record<Badge["tone"], string> = {
  neutral: "border-white/15 bg-white/10 text-slate-200",
  success: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
  warning: "border-amber-400/30 bg-amber-400/15 text-amber-200",
};

export function LeadIntelligencePipeline({
  data,
}: {
  data: LeadIntelligencePipelineData;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
      <div className="relative border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Active
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              {data.assignedTo}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {data.status}
            </span>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {data.title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {data.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.badges.map((badge) => (
              <span
                key={badge.label}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeToneClasses[badge.tone]}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {metric.label}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <div className="text-sm font-semibold text-white">
              Shared input fields
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Only the overlap between discovery and enrichment is shown here,
              so the frontend mirrors the common backend flow.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.inputs.map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="text-sm font-medium text-white">
                    {field.label}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">
                    {field.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <div className="text-sm font-semibold text-white">
              What the flow does
            </div>
            <div className="mt-4 space-y-4">
              {data.steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-xs font-semibold text-cyan-200">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{step.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-400">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">
              Shared output fields
            </div>
            <div className="mt-4 space-y-3">
              {data.outputs.map((field) => (
                <div
                  key={field.label}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="text-sm font-medium text-white">
                    {field.label}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">
                    {field.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
            <div className="text-sm font-semibold text-cyan-100">
              Backend aligned
            </div>
            <p className="mt-2 text-sm leading-6 text-cyan-50/80">
              This frontend card is mapped to the same common building blocks as
              your scraping, AI enrichment, email capture and verification
              backend.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
