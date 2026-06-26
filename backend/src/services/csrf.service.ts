import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../config/env";

export class CsrfService {
  sign(userId: string) {
    const nonce = randomBytes(24).toString("base64url");
    const signature = this.signature(userId, nonce);
    return `${nonce}.${signature}`;
  }

  verify(userId: string, token?: string) {
    if (!token) {
      return false;
    }

    const [nonce, signature] = token.split(".");
    if (!nonce || !signature) {
      return false;
    }

    const expected = this.signature(userId, nonce);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  }

  private signature(userId: string, nonce: string) {
    return createHmac("sha256", env.jwtSecret).update(`${userId}.${nonce}`).digest("base64url");
  }
}

export const csrfService = new CsrfService();
