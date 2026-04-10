import { after, NextResponse } from "next/server";
import { runMigrations } from "@/automation-system/core/db";
import { z } from "zod";
import { createRun, getRun, setRunMeta, updateRun } from "@/automation-system/automations/cold-outreach/run-state";
import { startColdOutreachWorkflow } from "@/automation-system/automations/cold-outreach/workflow";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  keyword: z.string().min(1),
  maxCount: z.number().int().positive().optional(),
  location: z.string().optional(),
});

function jsonNoStore(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...(init?.headers ?? {}),
    },
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Workflow failed";
}

function scheduleColdOutreachWorkflow(
  runId: string,
  input: {
    niche_slug: string;
    keyword: string;
    max_count?: number;
    location?: string;
    mode: "all" | "discovery" | "enrich" | "inject";
  }
) {
  after(async () => {
    try {
      await startColdOutreachWorkflow(runId, input);
    } catch (error: unknown) {
      await setRunMeta(runId, { status: "error", error: getErrorMessage(error) });
      await updateRun(runId, { current_step: "failed" });
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  await runMigrations();
  if (body.action === "pause" || body.action === "cancel") {
    const runId = String(body.runId || "");
    if (!runId) return jsonNoStore({ error: "Missing runId" }, { status: 400 });
      await setRunMeta(runId, {
        status: body.action === "pause" ? "paused" : "cancelled",
        paused_at: body.action === "pause",
        cancelled_at: body.action === "cancel",
        finished_at: body.action === "cancel",
      });
      await updateRun(runId, { current_step: body.action });
      return jsonNoStore({ success: true });
  }
  if (body.action === "continue") {
    const runId = String(body.runId || "");
    if (!runId) return jsonNoStore({ error: "Missing runId" }, { status: 400 });
    const run = await getRun(runId);
    if (!run) return jsonNoStore({ error: "Run not found" }, { status: 404 });
    scheduleColdOutreachWorkflow(runId, {
      niche_slug: "cold-outreach",
      keyword: String(run.data?.keyword || ""),
      max_count: run.data?.max_count ? Number(run.data.max_count) : undefined,
      location: run.data?.location || undefined,
      mode: body.mode === "discovery" || body.mode === "enrich" || body.mode === "inject" ? body.mode : "all",
    });
    return jsonNoStore({ success: true, data: { runId } });
  }

  const input = requestSchema.parse(body);
  const mode = body.mode === "discovery" || body.mode === "enrich" || body.mode === "inject" ? body.mode : "all";
  const runId = await createRun({
    automationName: "cold-outreach",
    mode,
    keyword: input.keyword,
    maxCount: input.maxCount,
    location: input.location,
  });

  scheduleColdOutreachWorkflow(runId, {
    niche_slug: "cold-outreach",
    keyword: input.keyword,
    max_count: input.maxCount,
    location: input.location,
    mode,
  });

  return jsonNoStore({ success: true, data: { runId, status: "queued", mode } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const includeLeads = searchParams.get("include") === "leads";
  if (!runId) return jsonNoStore({ error: "Missing runId" }, { status: 400 });
  await runMigrations();
  const run = await getRun(runId);
  if (!run) return jsonNoStore({ error: "Run not found" }, { status: 404 });
  if (!includeLeads) return jsonNoStore({ success: true, data: run });

  const leads = await import("@/automation-system/core/db").then(({ sql }) =>
    sql`SELECT website, original_name, company_name_short, official_company_name, decision_maker_name, decision_maker_last_name, primary_email, ico, address, business_facts, icebreaker_sentence, verification_status, verification_notes, sent_to_smartlead, updated_at
        FROM leads
        WHERE cold_run_id = ${runId}
        ORDER BY updated_at DESC, created_at DESC`
  );
  return jsonNoStore({ success: true, data: { run, leads } });
}
