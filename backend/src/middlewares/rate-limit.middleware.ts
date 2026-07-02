import type { NextFunction, Request, Response } from "express";
import { sendError } from "../http/error-response";
import { memoryService } from "../infrastructure/memory/memory.service";

export const rateLimitMiddleware = (limit = 300, windowSeconds = 60) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    const key = `rate:${request.ip}:${request.path}`;
    const result = await memoryService.rateLimit(key, limit, windowSeconds);
    response.setHeader("X-RateLimit-Remaining", String(result.remaining));
    if (!result.allowed) {
      sendError(response, request, 429, {
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down and retry shortly.",
        recoverable: true,
        nextAction: "retry_later"
      });
      return;
    }
    next();
  };
};
