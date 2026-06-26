import { Router } from "express";
import { persistenceService } from "../../database/persistence.service";

export const systemRouter = Router();

systemRouter.get("/readiness", (_request, response) => {
  const readiness = persistenceService.readiness();
  response.status(readiness.status === "not-ready" ? 503 : 200).json({ data: readiness });
});
