import { sql } from "../../core/db";

export type ColdOutreachMode = "all" | "discovery" | "enrich" | "inject";

export async function createRun(input: {
  automationName: string;
  mode: ColdOutreachMode;
  keyword: string;
  maxCount?: number;
  location?: string;
}) {
  const rows = await sql`
    INSERT INTO automation_runs (automation_name, status, data)
    VALUES (
      ${input.automationName},
      'queued',
      ${sql.json({
        mode: input.mode,
        current_step: "queued",
        keyword: input.keyword,
        max_count: input.maxCount ?? null,
        location: input.location ?? null,
        discovery_total: 0,
        discovered_count: 0,
        enriched_count: 0,
        sent_count: 0,
        lead_count: 0,
        last_lead: null,
      })}
    )
    RETURNING id
  `;
  return String(rows[0].id);
}

export async function getRun(runId: string) {
  const rows = await sql`SELECT * FROM automation_runs WHERE id = ${runId}`;
  return rows[0] ?? null;
}

export async function updateRun(runId: string, patch: Record<string, any>) {
  const rows = await sql`SELECT data FROM automation_runs WHERE id = ${runId}`;
  const current = rows[0]?.data ?? {};
  const next = { ...(current || {}), ...patch };
  await sql`
    UPDATE automation_runs
    SET data = ${sql.json(next)}, updated_at = now()
    WHERE id = ${runId}
  `;
}

export async function setRunMeta(runId: string, patch: {
  status?: string;
  error?: string | null;
  started_at?: boolean;
  finished_at?: boolean;
  paused_at?: boolean;
  cancelled_at?: boolean;
}) {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === "boolean") {
      if (value) sets.push(`${key} = now()`);
      continue;
    }
    sets.push(`${key} = $${idx++}`);
    values.push(value);
  }
  if (!sets.length) return;
  await sql.unsafe(`UPDATE automation_runs SET ${sets.join(", ")}, updated_at = now() WHERE id = $${idx}`, [...values, runId]);
}

export async function canContinueRun(runId: string): Promise<boolean> {
  const run = await getRun(runId);
  return !!run && run.status !== "cancelled" && run.status !== "finished";
}
