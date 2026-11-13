import { z } from "zod";

/** All configuration comes from environment variables (see .env.example). Invalid config stops the server at startup. */
const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  CLAUDE_MODEL: z.string().default("claude-opus-5-5"),
  DEEPSEEK_API_KEY: z.string().optional().default(""),
  DEEPSEEK_MODEL: z.string().default("deepseek-flash"),
  CHAT_DAILY_LIMIT: z.coerce.number().int().positive().default(60),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid server configuration:\n" + parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  /** Which AI answers the teacher chat: DeepSeek when its key is set, else Claude, else none. */
  ai: parsed.data.DEEPSEEK_API_KEY ? "deepseek" : parsed.data.ANTHROPIC_API_KEY ? "claude" : null,
  /** Allowed browser origins (comma-separated in FRONTEND_ORIGIN). */
  origins: parsed.data.FRONTEND_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean),
  accessTokenTtlSec: 15 * 60,
  refreshTokenTtlDays: 30,
};
