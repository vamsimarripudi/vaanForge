import type { NextFunction, Request, Response } from "express";
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
    .find((item) => item.startsWith("vmnexus_session="))
    ?.split("=")[1];

  const session = sessionService.verify(token);
  if (!session || (await sessionService.isRevoked(session))) {
    response.status(401).json({ error: "Authentication required" });
    return;
  }

  request.session = session;
  next();
};
