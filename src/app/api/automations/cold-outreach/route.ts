import { NextResponse } from "next/server";
import { handler } from "@/automation-system/automations/cold-outreach/handler";

export async function POST() {
  const result = await handler({
    niche_slug: "cold-outreach",
    keywords: ["lead generation"],
    region: "Slovakia",
    target_count: 10,
  });

  return NextResponse.json(result);
}

