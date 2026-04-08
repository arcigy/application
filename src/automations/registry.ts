import { LeadIntelligencePipeline, type LeadIntelligencePipelineData } from "./LeadIntelligencePipeline";
import { normalizeUserSlug } from "@/lib/user-slug";

export type DashboardAutomation = {
  slug: string;
  component: typeof LeadIntelligencePipeline;
  data: LeadIntelligencePipelineData;
};

const leadIntelligencePipeline: DashboardAutomation = {
  slug: "lead-intelligence-pipeline",
  component: LeadIntelligencePipeline,
  data: {
    title: "Lead Intelligence Pipeline",
    description:
      "Scrapes companies, enriches company pages, finds emails, generates AI text and verifies the result before the lead lands in your workflow.",
    assignedTo: "Branislav Laubert",
    status: "Company scraping + AI enrichment",
    badges: [
      { label: "Google Maps", tone: "neutral" },
      { label: "Serper", tone: "neutral" },
      { label: "Website scraping", tone: "neutral" },
      { label: "AI copy", tone: "success" },
      { label: "Email capture", tone: "success" },
      { label: "ORSR verify", tone: "warning" },
    ],
    metrics: [
      { label: "Discovery", value: "Maps + search" },
      { label: "Enrichment", value: "Site + email scan" },
      { label: "Verification", value: "Registry backed" },
      { label: "Result", value: "Qualified lead pack" },
    ],
    inputs: [
      {
        label: "query",
        description:
          "Core search phrase for the company niche, such as a city + industry combination.",
      },
      {
        label: "keywords",
        description:
          "Expanded keyword list used during lead discovery to widen the search net.",
      },
      {
        label: "region",
        description:
          "Target market or city/region where the scraping should focus.",
      },
      {
        label: "target_count",
        description:
          "How many unique companies the discovery phase should try to collect.",
      },
    ],
    outputs: [
      {
        label: "website",
        description:
          "Clean company domain that passes deduplication and can be enriched further.",
      },
      {
        label: "email",
        description: "Best email discovered from the website or fallback search.",
      },
      {
        label: "decision_maker_name",
        description:
          "Person identified from the site, register data or email pattern.",
      },
      {
        label: "company_name_short",
        description:
          "Human-friendly company label for the dashboard and outreach copy.",
      },
      {
        label: "ico / verification",
        description:
          "Company registration and verification status used to validate the lead.",
      },
    ],
    steps: [
      {
        title: "Find companies",
        description:
          "Search Google Maps and search results to collect candidate companies for a selected niche and region.",
      },
      {
        title: "Scrape websites",
        description:
          "Pull homepage and subpages to gather text, contact details and email addresses from the company site.",
      },
      {
        title: "Generate AI text",
        description:
          "Use the scraped content to build business facts, an icebreaker and a structured lead profile.",
      },
      {
        title: "Verify and dedupe",
        description:
          "Filter duplicates, validate the company identity and keep only the useful lead records.",
      },
    ],
  },
};

const automationsByUser = new Map<string, DashboardAutomation[]>([
  [normalizeUserSlug("Branislav Laubert"), [leadIntelligencePipeline]],
]);

export function getAutomationsForUser(userName: string): DashboardAutomation[] {
  return automationsByUser.get(normalizeUserSlug(userName)) ?? [];
}

