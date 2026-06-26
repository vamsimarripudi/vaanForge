import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { csrfCookieOptions } from "../../services/cookie-options";
import { csrfService } from "../../services/csrf.service";

export const securityRouter = Router();

securityRouter.get("/csrf", authMiddleware, (request, response) => {
  const token = csrfService.sign(request.session!.userId);
  response.cookie("vmnexus_csrf", token, csrfCookieOptions);
  response.json({ data: { csrfToken: token } });
});
