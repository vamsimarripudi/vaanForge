import type { NextFunction, Request, Response } from "express";
import { sendError } from "../http/error-response";
import { sessionService, type SessionPayload } from "../services/session.service";

declare module "express-serve-static-core" {
  interface Request {
    session?: SessionPayload;
  }
}

export const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  const cookieHeader = request.headers.cookie || "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("kravia_session="))
    ?.split("=")[1];

  const session = sessionService.verify(token);
  if (!session || (await sessionService.isRevoked(session))) {
    sendError(response, request, 401, {
      code: "AUTH_REQUIRED",
      message: "Sign in to continue.",
      recoverable: true,
      nextAction: "sign_in"
    });
    return;
  }

  request.session = session;
  next();
};
