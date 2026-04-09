import { inputSchema, type Output, type DiscoveredLead } from "./schema";
import { logRun } from "../../core/logger";
import { sql } from "../../core/db";
import type { AutomationResult } from "../../core/types";
import { randomUUID } from "crypto";
import { serperSearchTool } from "../../tools/google/serper-search.tool";

function normalizeDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

const DOMAIN_BLACKLIST = new Set([
  "zivefirmy.sk", "firmy.sk", "zlatestranky.sk", "123kurier.sk",
  "facebook.com", "instagram.com", "linkedin.com", "twitter.com",
  "youtube.com", "google.com", "maps.google.com", "yelp.com",
  "profesia.sk", "jobs.sk", "topky.sk", "sme.sk", "pravda.sk",
  "wikipedia.org", "gov.sk", "slovensko.sk", "nbs.sk", "statistics.sk"
]);

function isBlacklistedDomain(domain: string): boolean {
  return DOMAIN_BLACKLIST.has(domain) || domain.length < 4;
}

export async function handler(rawInput: unknown): Promise<AutomationResult<Output>> {
  const ctx = {
    automationName: "lead-discovery",
    runId: randomUUID(),
    startTime: Date.now(),
  };

  const input = inputSchema.parse(rawInput);
  const { keywords, region, target_count, niche_slug } = input;

  const existingDomens = await sql`SELECT website FROM leads`;
  const existingSet = new Set<string>(
    existingDomens
      .map(r => normalizeDomain(r.website))
      .filter(Boolean) as string[]
  );

  const discovered: DiscoveredLead[] = [];
  const seenDomains = new Set<string>();
  let duplicatesSkipped = 0;

  for (const keyword of keywords) {
    if (discovered.length >= target_count) break;

    const query = `"${keyword}" "${region}" kontakt email`;

    try {
      const results = await serperSearchTool({ query, limit: 100 });

      for (const r of results) {
        if (!r.link) continue;

        const domain = normalizeDomain(r.link);
        if (!domain || isBlacklistedDomain(domain)) continue;
        if (seenDomains.has(domain) || existingSet.has(domain)) {
          duplicatesSkipped++;
          continue;
        }

        seenDomains.add(domain);
        discovered.push({
          name: r.title.split("|")[0].split("-")[0].trim(),
          website: r.link.startsWith("http") ? r.link : `https://${r.link}`,
          source: "serper",
          niche_slug,
          region
        });
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (e: any) {
      console.warn(`Serper "${query}" failed: ${e.message}`);
    }
  }

  const finalLeads = discovered.slice(0, target_count);

  const result: AutomationResult<Output> = {
    success: true,
    data: {
      leads: finalLeads,
      total_found: finalLeads.length,
      duplicates_skipped: duplicatesSkipped
    },
    durationMs: Date.now() - ctx.startTime,
  };

  await logRun(ctx, result, input);
  return result;
}
