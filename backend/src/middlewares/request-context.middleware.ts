import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../infrastructure/logger";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    startedAt?: number;
    rawBody?: string;
  }
}

const SLOW_REQUEST_MS = 750;

export const requestContextMiddleware = (request: Request, response: Response, next: NextFunction) => {
  const requestId = request.header("x-request-id") || randomUUID();
  const startedAt = Date.now();

  request.requestId = requestId;
  request.startedAt = startedAt;
  response.setHeader("X-Request-ID", requestId);

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const metadata = {
      requestId,
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs
    };
    if (response.statusCode >= 500) {
      logger.error("API request failed.", metadata);
    } else if (durationMs >= SLOW_REQUEST_MS) {
      logger.warn("Slow API request.", metadata);
    } else {
      logger.debug("API request completed.", metadata);
    }
  });

  next();
};
