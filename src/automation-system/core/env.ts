import { z } from "zod";

// Next.js can import server modules during build before deployment secrets are
// present. Provide safe placeholders so the build can finish, while runtime
// code still reads real values when they exist.
const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
const isBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  (process.env.NODE_ENV === "production" &&
    !process.env.VERCEL_ENV &&
    !process.env.RAILWAY_ENVIRONMENT);

const fallback = {
  API_SECRET_KEY: "build-time-placeholder",
  DATABASE_URL: "postgresql://localhost:5432/postgres",
  REDIS_URL: "redis://localhost:6379",
  ANTHROPIC_API_KEY: "build-time-placeholder",
  SMARTLEAD_API_KEY: "build-time-placeholder",
  GEMINI_API_KEY: "build-time-placeholder",
};

type EnvShape = {
  API_SECRET_KEY: string;
  DATABASE_URL: string;
  AUTOMATION_DATABASE_URL?: string;
  REDIS_URL: string;
  ANTHROPIC_API_KEY: string;
  SLACK_WEBHOOK_URL?: string;
  SLACK_SIGNING_SECRET?: string;
  SLACK_BOT_TOKEN?: string;
  NOTION_API_KEY?: string;
  SMARTLEAD_API_KEY: string;
  GEMINI_API_KEY: string;
  SERPER_API_KEY?: string;
  GOOGLE_MAPS_API_KEYS?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  GOOGLE_SHEET_ID?: string;
  GOOGLE_REDIRECT_URI?: string;
};

const envSchema = z.object({
  API_SECRET_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  AUTOMATION_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),
  NOTION_API_KEY: z.string().min(1).optional(),
  SMARTLEAD_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
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
      API_SECRET_KEY: parsed.API_SECRET_KEY || (isTest || isBuild ? fallback.API_SECRET_KEY : undefined),
      DATABASE_URL:
        parsed.AUTOMATION_DATABASE_URL ||
        parsed.DATABASE_URL ||
        (isTest || isBuild ? fallback.DATABASE_URL : undefined),
      REDIS_URL: parsed.REDIS_URL || (isTest || isBuild ? fallback.REDIS_URL : undefined),
      ANTHROPIC_API_KEY:
        parsed.ANTHROPIC_API_KEY || (isTest || isBuild ? fallback.ANTHROPIC_API_KEY : undefined),
      SMARTLEAD_API_KEY:
        parsed.SMARTLEAD_API_KEY || (isTest || isBuild ? fallback.SMARTLEAD_API_KEY : undefined),
      GEMINI_API_KEY:
        parsed.GEMINI_API_KEY || (isTest || isBuild ? fallback.GEMINI_API_KEY : undefined),
    } as EnvShape;
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      console.error("Environment validation failed:", JSON.stringify(e.issues, null, 2));
    } else {
      console.error("Environment validation error:", e.message);
    }
    throw e;
  }
})();
