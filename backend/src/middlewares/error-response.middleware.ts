import type { NextFunction, Request, Response } from "express";
import { legacyToSafeError } from "../http/error-response";

export function errorResponseMiddleware(request: Request, response: Response, next: NextFunction) {
  const originalJson = response.json.bind(response);

  response.json = ((body?: unknown) => {
    if (response.statusCode >= 400 && body && typeof body === "object" && !("success" in body)) {
      return originalJson(legacyToSafeError(request, response.statusCode, body as Record<string, unknown>));
    }
    return originalJson(body);
  }) as Response["json"];

  next();
}
