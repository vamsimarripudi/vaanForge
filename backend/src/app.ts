import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { agentAdminRouter } from "./modules/vaanforge/agent-admin.routes";
import { vformixAgentAdminRouter, vformixAgentInternalRouter } from "./modules/vformix-agent/vformix-agent.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { rateLimitMiddleware } from "./middlewares/rate-limit.middleware";
import { csrfMiddleware } from "./middlewares/csrf.middleware";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(rateLimitMiddleware());
  app.use(csrfMiddleware);

  app.use("/api/v1", apiRouter);
  app.use("/api/admin/agent", agentAdminRouter);
  app.use("/api/admin/vformix", vformixAgentAdminRouter);
  app.use("/api/internal/vformix", vformixAgentInternalRouter);
  app.use(errorMiddleware);

  return app;
}
