import { z } from "zod";

// Allow empty strings or defaults for testing
const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

const envSchema = z.object({
  API_SECRET_KEY: isTest ? z.string().optional().default("test") : z.string().min(1),
  DATABASE_URL: isTest ? z.string().optional().default("postgresql://test") : z.string().url(),
  AUTOMATION_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: isTest ? z.string().optional().default("redis://test") : z.string().url(),
  ANTHROPIC_API_KEY: isTest ? z.string().optional().default("test") : z.string().min(1),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  NOTION_API_KEY: z.string().min(1).optional(),
  SMARTLEAD_API_KEY: isTest ? z.string().optional().default("test") : z.string().min(1),
  GEMINI_API_KEY: isTest ? z.string().optional().default("test") : z.string().min(1),
  SERPER_API_KEY: z.string().min(1).optional(),
  GOOGLE_MAPS_API_KEYS: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
});

export const env = (() => {
  try {
    const parsed = envSchema.parse(process.env);
    return {
      ...parsed,
      DATABASE_URL: parsed.AUTOMATION_DATABASE_URL || parsed.DATABASE_URL,
    };
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      console.error("❌ Environment validation failed:", JSON.stringify(e.issues, null, 2));
    } else {
      console.error("❌ Environment validation error:", e.message);
    }
    process.exit(1);
  }
})();
