import { createHash, randomBytes } from "node:crypto";
import { env } from "../../config/env";
import { emailService } from "../../infrastructure/email/email.service";
import { passwordService } from "../../services/password.service";
import { sessionService, type SessionPayload } from "../../services/session.service";
import type { CoreRole } from "@kravia/shared/roles";
import { authRepository, type AuthRepository } from "./auth.repository";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: CoreRole;
}

export class AuthService {
  constructor(private readonly repository: AuthRepository = authRepository) {}

  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    if (await this.repository.findByEmail(email)) {
      throw new Error("Email is already registered");
    }

    const user = await this.repository.create({
      name: input.name,
      email,
      passwordHash: passwordService.hash(input.password),
      role: input.role || "Founder"
    });

    const token = sessionService.sign({ userId: user.id, role: user.role });
    return { user: await this.publicUser(user.id), token };
  }

  async login(email: string, password: string) {
    const user = await this.repository.findByEmail(email.toLowerCase());
    if (!user || !passwordService.verify(password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    const token = sessionService.sign({ userId: user.id, role: user.role, organizationId: user.organizationId });
    return { user: await this.publicUser(user.id), token };
  }

  async requestPasswordReset(email: string) {
    const user = await this.repository.findByEmail(email.toLowerCase());
    if (!user) {
      return { accepted: true };
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hashResetToken(token);
    const expiresAt = new Date(Date.now() + env.passwordResetTtlSeconds * 1000).toISOString();
    await this.repository.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });
    const resetUrl = `${env.frontendUrl}/account/reset-password?token=${encodeURIComponent(token)}`;
    const delivery = await emailService.send({
      to: user.email,
      subject: "Reset your KRAVIA password",
      text: `Use this link to reset your KRAVIA password: ${resetUrl}\n\nThis link expires at ${expiresAt}.`
    });
    return { accepted: true, resetToken: token, expiresAt, delivery };
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await this.repository.findPasswordResetToken(this.hashResetToken(token));
    if (!resetToken || resetToken.consumedAt || new Date(resetToken.expiresAt).getTime() <= Date.now()) {
      throw new Error("Invalid or expired reset token");
    }

    const user = await this.repository.updatePassword(resetToken.userId, passwordService.hash(password));
    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    await this.repository.consumePasswordResetToken(resetToken.id);
    return { reset: true };
  }

  async publicUser(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };
  }

  async assignOrganization(userId: string, organizationId: string) {
    return this.repository.assignOrganization(userId, organizationId);
  }

  async logout(session: SessionPayload) {
    await sessionService.revoke(session);
  }

  private hashResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  health() {
    return this.repository.health();
  }
}

export const authService = new AuthService();
