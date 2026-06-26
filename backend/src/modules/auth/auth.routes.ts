import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { sessionCookieOptions } from "../../services/cookie-options";
import { authService } from "./auth.service";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

authRouter.post("/register", async (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid registration", issues: parsed.error.issues });
    return;
  }

  try {
    const result = await authService.register(parsed.data);
    response
      .cookie("vmnexus_session", result.token, sessionCookieOptions)
      .status(201)
      .json({ data: result.user });
  } catch (error) {
    response.status(409).json({ error: error instanceof Error ? error.message : "Registration failed" });
  }
});

authRouter.post("/login", async (request, response) => {
  const parsed = z.object({ email: z.string().email(), password: z.string() }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid login", issues: parsed.error.issues });
    return;
  }

  try {
    const result = await authService.login(parsed.data.email, parsed.data.password);
    response.cookie("vmnexus_session", result.token, sessionCookieOptions).json({ data: result.user });
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
  }
});

authRouter.post("/password-reset/request", async (request, response) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid password reset request", issues: parsed.error.issues });
    return;
  }

  const result = await authService.requestPasswordReset(parsed.data.email);
  response.status(202).json({ data: result });
});

authRouter.post("/password-reset/confirm", async (request, response) => {
  const parsed = z.object({ token: z.string().min(20), password: z.string().min(8) }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid password reset confirmation", issues: parsed.error.issues });
    return;
  }

  try {
    response.json({ data: await authService.resetPassword(parsed.data.token, parsed.data.password) });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Password reset failed" });
  }
});

authRouter.get("/session", authMiddleware, async (request, response) => {
  response.json({ data: await authService.publicUser(request.session!.userId) });
});

authRouter.post("/logout", authMiddleware, async (request, response) => {
  await authService.logout(request.session!);
  response.clearCookie("vmnexus_session", sessionCookieOptions).json({ data: { loggedOut: true } });
});
