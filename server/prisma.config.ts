import { defineConfig, env } from "prisma/config";

// Loads DATABASE_URL from server/.env when present.
try { process.loadEnvFile(".env"); } catch {}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
