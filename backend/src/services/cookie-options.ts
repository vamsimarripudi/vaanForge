import type { CookieOptions } from "express";
import { env } from "../config/env";

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  domain: env.nodeEnv === "production" ? env.vaanforgeCookieDomain : undefined,
  maxAge: env.sessionTtlSeconds * 1000
};

export const adminSessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.nodeEnv === "production",
  domain: env.nodeEnv === "production" ? "admin.vaanforge.com" : undefined,
  maxAge: Math.min(env.sessionTtlSeconds, 60 * 60 * 2) * 1000
};

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  sameSite: "lax",
  secure: env.nodeEnv === "production",
  domain: env.nodeEnv === "production" ? env.vaanforgeCookieDomain : undefined
};
