import type { NextFunction, Request, Response } from "express";
import { roleHasPermission } from "@kravia/shared/permissions";
import type { CoreRole } from "@kravia/shared/roles";
import { sendError } from "../http/error-response";

export const requirePermission = (permission: string) => {
  return (request: Request, response: Response, next: NextFunction) => {
    const role = request.session?.role as CoreRole | undefined;
    if (!role || !roleHasPermission(role, permission)) {
      sendError(response, request, 403, {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to perform this action.",
        recoverable: true,
        nextAction: "request_access",
        fieldErrors: { permission: `Missing permission: ${permission}` }
      });
      return;
    }

    next();
  };
};
