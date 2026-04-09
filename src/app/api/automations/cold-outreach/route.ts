import { NextResponse } from "next/server";
import { runMigrations } from "@/automation-system/core/db";
import { z } from "zod";
import { createRun, getRun, setRunMeta } from "@/automation-system/automations/cold-outreach/run-state";
import { startColdOutreachWorkflow } from "@/automation-system/automations/cold-outreach/workflow";

const requestSchema = z.object({
  keyword: z.string().min(1),
  profession: z.string().min(1),
  maxCount: z.number().int().positive().optional(),
  location: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  await runMigrations();
  if (body.action === "pause" || body.action === "cancel") {
    const runId = String(body.runId || "");
    if (!runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });
      await setRunMeta(runId, {
        status: body.action === "pause" ? "paused" : "cancelled",
        paused_at: body.action === "pause",
        cancelled_at: body.action === "cancel",
        finished_at: body.action === "cancel",
      });
      await import("@/automation-system/automations/cold-outreach/run-state").then(({ updateRun }) =>
        updateRun(runId, { current_step: body.action })
      );
      return NextResponse.json({ success: true });
  }
  if (body.action === "continue") {
    const runId = String(body.runId || "");
    if (!runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });
    const run = await getRun(runId);
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    void startColdOutreachWorkflow(runId, {
      niche_slug: "cold-outreach",
      keyword: String(run.keyword || ""),
      profession: String(run.profession || ""),
      max_count: run.max_count ? Number(run.max_count) : undefined,
      location: run.location || undefined,
      mode: body.mode === "discovery" || body.mode === "enrich" || body.mode === "inject" ? body.mode : "all",
    }).catch(async (error: any) => {
      await setRunMeta(runId, { status: "error", error: error?.message || "Workflow failed" });
      await import("@/automation-system/automations/cold-outreach/run-state").then(({ updateRun }) =>
        updateRun(runId, { current_step: "failed" })
      );
    });
    return NextResponse.json({ success: true, data: { runId } });
  }

  const input = requestSchema.parse(body);
  const mode = body.mode === "discovery" || body.mode === "enrich" || body.mode === "inject" ? body.mode : "all";
  const runId = await createRun({
    mode,
    keyword: input.keyword,
    profession: input.profession,
    maxCount: input.maxCount,
    location: input.location,
  });

    void startColdOutreachWorkflow(runId, {
    niche_slug: "cold-outreach",
    keyword: input.keyword,
    profession: input.profession,
    max_count: input.maxCount,
    location: input.location,
    mode,
    }).catch(async (error: any) => {
      await setRunMeta(runId, { status: "error", error: error?.message || "Workflow failed" });
      await import("@/automation-system/automations/cold-outreach/run-state").then(({ updateRun }) =>
        updateRun(runId, { current_step: "failed" })
      );
    });

  return NextResponse.json({ success: true, data: { runId, status: "queued", mode } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const includeLeads = searchParams.get("include") === "leads";
  if (!runId) return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  await runMigrations();
  const run = await getRun(runId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (!includeLeads) return NextResponse.json({ success: true, data: run });

  const leads = await import("@/automation-system/core/db").then(({ sql }) =>
    sql`SELECT website, original_name, company_name_short, official_company_name, decision_maker_name, decision_maker_last_name, primary_email, ico, address, business_facts, icebreaker_sentence, verification_status, verification_notes, sent_to_smartlead, updated_at
        FROM leads
        WHERE cold_run_id = ${runId}
        ORDER BY updated_at DESC, created_at DESC`
  );
  return NextResponse.json({ success: true, data: { run, leads } });
}
