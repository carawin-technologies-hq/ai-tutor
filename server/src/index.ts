import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

const server = createApp().listen(config.PORT, () => {
  console.log(`CARAWIN API listening on http://localhost:${config.PORT}  (AI teacher: ${config.ai ?? "off — set DEEPSEEK_API_KEY or ANTHROPIC_API_KEY"})`);
});

const shutdown = () => server.close(async () => { await prisma.$disconnect(); process.exit(0); });
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
