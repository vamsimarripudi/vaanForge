import type { NextFunction, Request, Response } from "express";
import { roleHasPermission } from "@vmnexus/shared/permissions";
import type { CoreRole } from "@vmnexus/shared/roles";

export const requirePermission = (permission: string) => {
  return (request: Request, response: Response, next: NextFunction) => {
    const role = request.session?.role as CoreRole | undefined;
    if (!role || !roleHasPermission(role, permission)) {
      response.status(403).json({ error: "Permission denied", permission });
      return;
    }

    next();
  };
};
