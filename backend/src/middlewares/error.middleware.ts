import type { ErrorRequestHandler } from "express";
import { env } from "../config/env";
import { buildErrorResponse } from "../http/error-response";
import { logger } from "../infrastructure/logger";

export const errorMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  logger.error("Unhandled API error.", { requestId: request.requestId, path: request.path, method: request.method, message });
  const exposeDetail = env.nodeEnv !== "production";
  response.status(500).json(buildErrorResponse(request, {
    code: "INTERNAL_ERROR",
    message: exposeDetail ? message : "An unexpected server error occurred.",
    recoverable: false,
    nextAction: "contact_support"
  }));
};
