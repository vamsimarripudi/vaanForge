import type { NextFunction, Request, Response } from "express";
import { memoryService } from "../infrastructure/memory/memory.service";

export const rateLimitMiddleware = (limit = 300, windowSeconds = 60) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    const key = `rate:${request.ip}:${request.path}`;
    const result = await memoryService.rateLimit(key, limit, windowSeconds);
    response.setHeader("X-RateLimit-Remaining", String(result.remaining));
    if (!result.allowed) {
      response.status(429).json({ error: "Rate limit exceeded" });
      return;
    }
    next();
  };
};
