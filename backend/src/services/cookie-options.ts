import type { CookieOptions } from "express";
import { env } from "../config/env";

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  maxAge: env.sessionTtlSeconds * 1000
};

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  sameSite: "lax",
  secure: env.nodeEnv === "production"
};
