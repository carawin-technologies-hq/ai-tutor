import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { errorHandler, notFound } from "./lib/http.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { contentRouter } from "./routes/content.js";
import { parentsRouter } from "./routes/parents.js";
import { practiceRouter } from "./routes/practice.js";
import { studentsRouter } from "./routes/students.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // correct client IPs behind Vercel/Render/Railway proxies (rate limits)
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.origins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, ai: !!config.ANTHROPIC_API_KEY, google: !!config.GOOGLE_CLIENT_ID });
  });

  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/students", studentsRouter);
  api.use("/parents", parentsRouter);
  api.use("/admin", adminRouter);
  api.use("/chat", chatRouter);
  api.use("/", practiceRouter); // /practice, /assessments, /attempts
  api.use("/", contentRouter); // /curriculum, /lessons, /videos, /library, /notifications
  app.use("/api/v1", api);

  app.use((_req, _res, next) => next(notFound("Endpoint")));
  app.use(errorHandler);
  return app;
}
