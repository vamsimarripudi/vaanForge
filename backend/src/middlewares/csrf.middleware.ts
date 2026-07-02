import type { NextFunction, Request, Response } from "express";
import { sendError } from "../http/error-response";
import { csrfService } from "../services/csrf.service";
import { sessionService } from "../services/session.service";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const PUBLIC_MUTATION_PATHS = new Set([
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/password-reset/request",
  "/api/v1/auth/password-reset/confirm"
]);

const SIGNED_WEBHOOK_PATHS = new Set([
  "/api/v1/webhooks/razorpay",
  "/api/internal/vformix/agent/webhook"
]);

const cookieValue = (cookieHeader: string | undefined, name: string) =>
  (cookieHeader || "")
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);

export const csrfMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(request.method) || PUBLIC_MUTATION_PATHS.has(request.path) || SIGNED_WEBHOOK_PATHS.has(request.path)) {
    next();
    return;
  }

  const sessionToken = cookieValue(request.headers.cookie, "kravia_session");
  const session = sessionService.verify(sessionToken);
  if (!session || (await sessionService.isRevoked(session))) {
    sendError(response, request, 401, {
      code: "AUTH_REQUIRED",
      message: "Sign in to continue.",
      recoverable: true,
      nextAction: "sign_in"
    });
    return;
  }

  const headerToken = request.header("x-csrf-token");
  const cookieToken = cookieValue(request.headers.cookie, "kravia_csrf");

  if (!headerToken || !cookieToken || headerToken !== cookieToken || !csrfService.verify(session.userId, headerToken)) {
    sendError(response, request, 403, {
      code: "PERMISSION_DENIED",
      message: "Protected action could not be verified.",
      recoverable: true,
      nextAction: "refresh_session"
    });
    return;
  }

  request.session = session;
  next();
};
