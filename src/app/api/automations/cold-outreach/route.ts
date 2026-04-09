import { NextResponse } from "next/server";
import { handler } from "@/automation-system/automations/cold-outreach/handler";
import { runMigrations } from "@/automation-system/core/db";
import { z } from "zod";

const requestSchema = z.object({
  keyword: z.string().min(1),
  profession: z.string().min(1),
  maxCount: z.number().int().positive().optional(),
  location: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const input = requestSchema.parse(body);

  await runMigrations();

  const result = await handler({
    niche_slug: "cold-outreach",
    keyword: input.keyword,
    profession: input.profession,
    max_count: input.maxCount,
    location: input.location,
  });

  return NextResponse.json(result);
}
