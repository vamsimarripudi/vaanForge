import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export class PasswordService {
  hash(password: string) {
    const salt = randomBytes(16).toString("hex");
    const digest = createHash("sha256").update(`${salt}:${password}`).digest("hex");
    return `${salt}:${digest}`;
  }

  verify(password: string, storedHash: string) {
    const [salt, digest] = storedHash.split(":");
    if (!salt || !digest) {
      return false;
    }

    const actual = createHash("sha256").update(`${salt}:${password}`).digest("hex");
    return timingSafeEqual(Buffer.from(actual), Buffer.from(digest));
  }
}

export const passwordService = new PasswordService();
