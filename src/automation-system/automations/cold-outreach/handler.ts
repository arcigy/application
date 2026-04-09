import { randomUUID } from "crypto";
import { sql } from "../../core/db";
import { logRun } from "../../core/logger";
import type { AutomationResult } from "../../core/types";
import { getActiveNiche, logNicheStats } from "../niche-manager/handler";
import { handler as discoveryHandler } from "../lead-discovery/handler";
import { handler as enrichmentHandler } from "../lead-enricher/handler";
import { injectToSmartlead } from "../smartlead-injector/handler";

type ColdOutreachInput = {
  niche_slug?: string;
  keyword?: string;
  profession?: string;
  max_count?: number;
  location?: string;
};

const DEFAULT_SLOVAK_REGIONS = [
  "Bratislavský kraj",
  "Trnavský kraj",
  "Nitriansky kraj",
  "Trenčiansky kraj",
  "Žilinský kraj",
  "Banskobystrický kraj",
  "Prešovský kraj",
  "Košický kraj",
];

function buildRegions(location?: string): string[] {
  if (location && location.trim()) return [location.trim()];
  return DEFAULT_SLOVAK_REGIONS;
}

export async function handler(rawInput: unknown): Promise<AutomationResult<any>> {
  const ctx = {
    automationName: "cold-outreach",
    runId: randomUUID(),
    startTime: Date.now(),
  };

  try {
    const input = (rawInput || {}) as ColdOutreachInput;
    const keyword = (input.keyword || "lead generation").trim();
    const profession = (input.profession || keyword).trim();
    const targetCount = input.max_count && input.max_count > 0 ? input.max_count : 999999;
    const regions = buildRegions(input.location);
    const niche = await getActiveNiche();

    if (!niche) throw new Error("Žiadny aktívny niche nenájdený v databáze.");

    const discovered: any[] = [];
    const allEnriched: any[] = [];

    for (const region of regions) {
      const discoveryRes = await discoveryHandler({
        niche_slug: input.niche_slug || niche.slug || "cold-outreach",
        keywords: [keyword, profession].filter(Boolean),
        region,
        target_count: Math.max(targetCount, 1),
      });

      if (!discoveryRes.success || !discoveryRes.data) continue;

      const rawLeads = discoveryRes.data.leads || [];
      discovered.push(...rawLeads);
      await logNicheStats(niche.id, { discovered: rawLeads.length });

      if (rawLeads.length === 0) continue;

      const enrichmentRes = await enrichmentHandler({
        leads: rawLeads.map((l: any) => ({ name: l.name, website: l.website })),
        aggressive_scraping: true,
        campaign_tag: `cold_${niche.slug}`,
      });

      if (!enrichmentRes.success || !enrichmentRes.data) continue;

      const enrichedLeads = enrichmentRes.data.leads || [];
      allEnriched.push(...enrichedLeads);
      await logNicheStats(niche.id, { enriched: enrichedLeads.length });

      const qualified = enrichedLeads.filter((l: any) => l.email && (l.decision_maker_name || l.phone));
      await logNicheStats(niche.id, { qualified: qualified.length });

      const toInject = qualified.slice(0, targetCount);
      if (toInject.length > 0) {
        await injectToSmartlead(toInject, niche);
        await logNicheStats(niche.id, { sent_to_smartlead: toInject.length });
      }
    }

    await sql`UPDATE niches SET last_worked_at = NOW() WHERE id = ${niche.id}`;

    const result = {
      success: true,
      data: {
        niche: niche.slug,
        keyword,
        profession,
        regions,
        discovered: discovered.length,
        enriched: allEnriched.length,
      },
      durationMs: Date.now() - ctx.startTime,
    };

    await logRun(ctx, result, input);
    return result;
  } catch (error: any) {
    const result = {
      success: false,
      error: error.message,
      durationMs: Date.now() - ctx.startTime,
    };
    await logRun(ctx, result, rawInput);
    throw error;
  }
}
