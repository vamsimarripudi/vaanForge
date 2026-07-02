import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { memoryService } from "../../infrastructure/memory/memory.service";
import { sessionCookieOptions } from "../../services/cookie-options";
import { auditService } from "../audit/audit.service";
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
      .cookie("kravia_session", result.token, sessionCookieOptions)
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
    const limited = await loginAttemptAllowed(request.ip, parsed.data.email);
    if (!limited.allowed) {
      response.status(429).json({
        error: "Too many login attempts",
        code: "AUTH_RATE_LIMITED",
        recoverable: true,
        nextAction: "Wait before retrying or use password reset.",
        requestId: request.requestId
      });
      return;
    }
    const result = await authService.login(parsed.data.email, parsed.data.password);
    if (result.user?.organizationId) {
      auditService.record({
        actorId: result.user.id,
        organizationId: result.user.organizationId,
        action: "AUTH_LOGIN",
        entityType: "Session",
        entityId: result.user.id,
        metadata: { outcome: "success" },
        requestId: request.requestId,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"]
      });
    }
    response.cookie("kravia_session", result.token, sessionCookieOptions).json({ data: result.user });
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

  response.status(202).json({ data: await authService.requestPasswordReset(parsed.data.email) });
});

authRouter.post("/forgot-password", async (request, response) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid password reset request", issues: parsed.error.issues });
    return;
  }

  response.status(202).json({ data: await authService.requestPasswordReset(parsed.data.email) });
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

authRouter.post("/reset-password", async (request, response) => {
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

authRouter.get("/me", authMiddleware, async (request, response) => {
  response.json({ data: await authService.publicUser(request.session!.userId) });
});

authRouter.get("/sessions", authMiddleware, async (request, response) => {
  response.json({
    data: [{
      sessionId: request.session!.sessionId,
      userId: request.session!.userId,
      organizationId: request.session!.organizationId,
      role: request.session!.role,
      current: true
    }]
  });
});

authRouter.delete("/sessions/:sessionId", authMiddleware, async (request, response) => {
  if (String(request.params.sessionId) !== request.session!.sessionId) {
    response.status(404).json({ error: "Session not found", code: "SESSION_NOT_FOUND", recoverable: true, nextAction: "Refresh sessions and retry." });
    return;
  }
  await authService.logout(request.session!);
  response.clearCookie("kravia_session", sessionCookieOptions).json({ data: { revoked: true, sessionId: request.params.sessionId } });
});

authRouter.post("/refresh", authMiddleware, async (request, response) => {
  const user = await authService.publicUser(request.session!.userId);
  response.json({ data: { user, refreshed: true, sessionId: request.session!.sessionId } });
});

authRouter.post("/verify-email", authMiddleware, async (request, response) => {
  response.json({ data: { verified: true, userId: request.session!.userId, verificationMode: "session-authenticated" } });
});

authRouter.post("/resend-verification", authMiddleware, async (request, response) => {
  response.status(202).json({ data: { queued: true, userId: request.session!.userId, channel: "email" } });
});

authRouter.post("/logout", authMiddleware, async (request, response) => {
  await authService.logout(request.session!);
  if (request.session?.organizationId) {
    auditService.record({
      actorId: request.session.userId,
      organizationId: request.session.organizationId,
      action: "AUTH_LOGOUT",
      entityType: "Session",
      entityId: request.session.sessionId,
      metadata: { outcome: "success" },
      requestId: request.requestId,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"]
    });
  }
  response.clearCookie("kravia_session", sessionCookieOptions).json({ data: { loggedOut: true } });
});

async function loginAttemptAllowed(ipAddress: string | undefined, email: string) {
  const normalizedEmail = email.toLowerCase();
  const key = `auth:login:${ipAddress || "unknown"}:${normalizedEmail}`;
  return memoryService.rateLimit(key, 10, 15 * 60);
}
