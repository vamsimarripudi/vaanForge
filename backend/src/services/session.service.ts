import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";
import { memoryService } from "../infrastructure/memory/memory.service";

export interface SessionPayload {
  sessionId: string;
  userId: string;
  organizationId?: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
}

export class SessionService {
  sign(payload: Omit<SessionPayload, "sessionId" | "issuedAt" | "expiresAt">, now = Date.now()) {
    const issuedAt = Math.floor(now / 1000);
    const sessionPayload: SessionPayload = {
      ...payload,
      sessionId: randomBytes(16).toString("base64url"),
      issuedAt,
      expiresAt: issuedAt + env.sessionTtlSeconds
    };
    const encodedPayload = Buffer.from(JSON.stringify(sessionPayload)).toString("base64url");
    const nonce = randomBytes(8).toString("hex");
    const body = `${encodedPayload}.${nonce}`;
    const signature = createHmac("sha256", env.jwtSecret).update(body).digest("base64url");
    return `${body}.${signature}`;
  }

  verify(token?: string, now = Date.now()): SessionPayload | null {
    if (!token) {
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedPayload, nonce, signature] = parts;
    const body = `${encodedPayload}.${nonce}`;
    const expected = createHmac("sha256", env.jwtSecret).update(body).digest("base64url");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    const nowSeconds = Math.floor(now / 1000);

    if (!payload.expiresAt || payload.expiresAt <= nowSeconds) {
      return null;
    }

    return payload;
  }

  async revoke(payload: SessionPayload, now = Date.now()) {
    const remainingSeconds = Math.max(payload.expiresAt - Math.floor(now / 1000), 1);
    await memoryService.set(this.revocationKey(payload.sessionId), true, remainingSeconds);
  }

  async isRevoked(payload: SessionPayload) {
    return (await memoryService.get<boolean>(this.revocationKey(payload.sessionId))) === true;
  }

  private revocationKey(sessionId: string) {
    return `session:revoked:${sessionId}`;
  }
}

export const sessionService = new SessionService();
