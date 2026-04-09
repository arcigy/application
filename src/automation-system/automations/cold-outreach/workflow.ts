import { sql } from "../../core/db";
import { getActiveNiche, logNicheStats } from "../niche-manager/handler";
import { handler as discoveryHandler } from "../lead-discovery/handler";
import { handler as enrichmentHandler } from "../lead-enricher/handler";
import { injectToSmartlead } from "../smartlead-injector/handler";
import { SLOVAK_DISTRICTS } from "./slovakia-districts";
import { canContinueRun, getRun, setRunMeta, updateRun } from "./run-state";

type Input = {
  niche_slug?: string;
  keyword?: string;
  profession?: string;
  max_count?: number;
  location?: string;
  mode?: "all" | "discovery" | "enrich" | "inject";
};

function buildRegions(location?: string): string[] {
  return location?.trim() ? [location.trim()] : [...SLOVAK_DISTRICTS];
}

async function insertDiscoveredLeads(runId: string, leads: any[], campaignTag: string) {
  for (const lead of leads) {
    await sql`
      INSERT INTO leads (website, original_name, company_name_short, verification_status, verification_notes, campaign_tag, cold_run_id, updated_at)
      VALUES (${lead.website}, ${lead.name}, ${lead.name}, 'discovered', 'Discovered, waiting for enrichment', ${campaignTag}, ${runId}, now())
      ON CONFLICT (website) DO UPDATE SET
        original_name = EXCLUDED.original_name,
        company_name_short = EXCLUDED.company_name_short,
        verification_status = EXCLUDED.verification_status,
        verification_notes = EXCLUDED.verification_notes,
        cold_run_id = EXCLUDED.cold_run_id,
        campaign_tag = COALESCE(leads.campaign_tag, EXCLUDED.campaign_tag),
        updated_at = EXCLUDED.updated_at;
    `;
  }
}

export async function startColdOutreachWorkflow(runId: string, rawInput: Input) {
  const input = rawInput || {};
  const run = await getRun(runId);
  if (!run) throw new Error("Run not found");

  await setRunMeta(runId, { status: "running", started_at: true });
  await updateRun(runId, { current_step: "initializing" });
  const keyword = (input.keyword || "lead generation").trim();
  const profession = (input.profession || keyword).trim();
  const targetCount = input.max_count && input.max_count > 0 ? input.max_count : 999999;
  const regions = buildRegions(input.location);
  const niche = await getActiveNiche();
  if (!niche) throw new Error("Žiadny aktívny niche nenájdený v databáze.");

  let rawLeads: any[] = [];
  if (input.mode === "all" || input.mode === "discovery") {
    await updateRun(runId, { current_step: "discovery" });
    const discoveryRes = await discoveryHandler({
      niche_slug: input.niche_slug || niche.slug || "cold-outreach",
      keywords: [keyword, profession].filter(Boolean),
      region: regions[0],
      target_count: Math.max(targetCount, 1),
    });
    if (!discoveryRes.success || !discoveryRes.data) {
      throw new Error("Discovery failed.");
    }
    rawLeads = discoveryRes.data.leads || [];
    await updateRun(runId, { discovered_count: rawLeads.length, lead_count: rawLeads.length });
    await logNicheStats(niche.id, { discovered: rawLeads.length });
    await insertDiscoveredLeads(runId, rawLeads, `cold_${niche.slug}`);
    if (input.mode === "discovery") {
      await setRunMeta(runId, { status: "paused", paused_at: true, finished_at: true });
      await updateRun(runId, { current_step: "discovery_done" });
      return;
    }
  } else {
    const rows = await sql`SELECT website, original_name as name FROM leads WHERE cold_run_id = ${runId} ORDER BY created_at ASC`;
    rawLeads = rows as any[];
  }

  if (!(await canContinueRun(runId))) return;
  await updateRun(runId, { current_step: "enrichment" });
  const enrichmentRes = await enrichmentHandler({
    leads: rawLeads.map((l: any) => ({ name: l.name, website: l.website })),
    aggressive_scraping: true,
    campaign_tag: `cold_${niche.slug}`,
  });
  if (!enrichmentRes.success || !enrichmentRes.data) {
    throw new Error("Enrichment failed.");
  }

  const enrichedLeads = enrichmentRes.data.leads || [];
  await updateRun(runId, { enriched_count: enrichedLeads.length });
  await logNicheStats(niche.id, { enriched: enrichedLeads.length });

  if (input.mode === "enrich") {
      await setRunMeta(runId, { status: "paused", paused_at: true, finished_at: true });
      await updateRun(runId, { current_step: "enrichment_done" });
    return;
  }

  const qualified = enrichedLeads.filter((l: any) => l.email && (l.decision_maker_name || l.phone));
  await updateRun(runId, { current_step: "injecting" });
  const toInject = qualified.slice(0, targetCount);
  if (toInject.length > 0) {
    const injectRes = await injectToSmartlead(toInject, niche);
    await updateRun(runId, { sent_count: injectRes.sent });
    await logNicheStats(niche.id, { sent_to_smartlead: injectRes.sent });
  }

  if (input.mode === "inject") {
      await setRunMeta(runId, { status: "paused", paused_at: true, finished_at: true });
      await updateRun(runId, { current_step: "inject_done" });
    return;
  }

  await sql`UPDATE niches SET last_worked_at = NOW() WHERE id = ${niche.id}`;
  await setRunMeta(runId, { status: "finished", finished_at: true });
  await updateRun(runId, { current_step: "done" });
}
