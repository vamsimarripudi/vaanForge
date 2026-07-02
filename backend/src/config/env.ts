import "dotenv/config";
import { adminVaanForgeOrigins, approvedVaanForgeOrigins, localDevelopmentOrigins } from "./vaanforge-domains";

const persistenceMode: "memory" | "postgres" = process.env.PERSISTENCE_MODE === "postgres" ? "postgres" : "memory";
const emailProvider = process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === "production" ? "placeholder" : "local");
const smsProvider = process.env.SMS_PROVIDER || (process.env.NODE_ENV === "production" ? "placeholder" : "local");
const s3Endpoint = process.env.S3_ENDPOINT || (process.env.NODE_ENV === "production" ? "placeholder" : "local");
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || (process.env.NODE_ENV === "production" ? "placeholder" : "local");
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || (process.env.NODE_ENV === "production" ? "placeholder" : "local");
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || (process.env.NODE_ENV === "production" ? "placeholder" : "local");

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  rootDomain: process.env.ROOT_DOMAIN || "example.com",
  vaanforgePublicUrl: process.env.VAANFORGE_PUBLIC_URL || "https://vaanforge.com",
  vaanforgeAppUrl: process.env.VAANFORGE_APP_URL || "https://app.vaanforge.com",
  vaanforgeAuthUrl: process.env.VAANFORGE_AUTH_URL || "https://auth.vaanforge.com",
  vaanforgeApiUrl: process.env.VAANFORGE_API_URL || "https://api.vaanforge.com",
  vaanforgeAdminUrl: process.env.VAANFORGE_ADMIN_URL || "https://admin.vaanforge.com",
  vaanforgeCookieDomain: process.env.VAANFORGE_COOKIE_DOMAIN || ".vaanforge.com",
  corsExtraOrigins: csv(process.env.CORS_EXTRA_ORIGINS),
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kravia",
  persistenceMode,
  jwtSecret: process.env.JWT_SECRET || "replace-with-secure-secret-only-for-local-development",
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 8),
  passwordResetTtlSeconds: Number(process.env.PASSWORD_RESET_TTL_SECONDS || 60 * 30),
  memoryAdapter: process.env.MEMORY_ADAPTER || "redis",
  realtimeAdapter: process.env.REALTIME_ADAPTER || "external",
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
  emailProvider,
  smsProvider,
  s3Endpoint,
  aiProvider: process.env.AI_PROVIDER || "deterministic",
  awsRegion: process.env.AWS_REGION || "",
  parameterStoreEnabled: process.env.PARAMETER_STORE_ENABLED === "true",
  parameterStorePrefix: process.env.PARAMETER_STORE_PREFIX || "/vaanforge/prod",
  allowLocalEnvInProduction: process.env.ALLOW_LOCAL_ENV_IN_PRODUCTION === "true",
  vformixAgentWebhookToken: process.env.VFORMIX_AGENT_WEBHOOK_TOKEN || "replace-with-vformix-agent-webhook-token"
};

export const allowedCorsOrigins = env.nodeEnv === "production"
  ? Array.from(new Set([...approvedVaanForgeOrigins(), ...env.corsExtraOrigins]))
  : localDevelopmentOrigins(env.frontendUrl);

export const adminCorsOrigins = env.nodeEnv === "production"
  ? Array.from(new Set(adminVaanForgeOrigins()))
  : localDevelopmentOrigins(env.frontendUrl);

const requiredProductionValues: Array<[keyof typeof env, string]> = [
  ["databaseUrl", "DATABASE_URL"],
  ["jwtSecret", "JWT_SECRET"],
  ["razorpayKeyId", "RAZORPAY_KEY_ID"],
  ["razorpayKeySecret", "RAZORPAY_KEY_SECRET"],
  ["razorpayWebhookSecret", "RAZORPAY_WEBHOOK_SECRET"],
  ["vformixAgentWebhookToken", "VFORMIX_AGENT_WEBHOOK_TOKEN"]
];

const insecureValuePatterns = [/placeholder/i, /replace-with/i, /^local$/i, /postgres:postgres/i];

function validateProductionEnv() {
  if (env.nodeEnv !== "production") return;
  if (!env.parameterStoreEnabled && !env.allowLocalEnvInProduction) {
    throw new Error("Production requires AWS Systems Manager Parameter Store. Set PARAMETER_STORE_ENABLED=true or explicitly set ALLOW_LOCAL_ENV_IN_PRODUCTION=true for a controlled break-glass deployment.");
  }
  const missing = requiredProductionValues
    .filter(([key]) => {
      const value = String(env[key] || "");
      return !value || insecureValuePatterns.some((pattern) => pattern.test(value));
    })
    .map(([, name]) => name);

  if (missing.length) {
    throw new Error(`Production environment is missing secure values for: ${missing.join(", ")}`);
  }

  if (!/^https:\/\//i.test(env.frontendUrl)) {
    throw new Error("FRONTEND_URL must use HTTPS in production.");
  }

  for (const [name, value] of [
    ["VAANFORGE_PUBLIC_URL", env.vaanforgePublicUrl],
    ["VAANFORGE_APP_URL", env.vaanforgeAppUrl],
    ["VAANFORGE_AUTH_URL", env.vaanforgeAuthUrl],
    ["VAANFORGE_API_URL", env.vaanforgeApiUrl],
    ["VAANFORGE_ADMIN_URL", env.vaanforgeAdminUrl]
  ]) {
    if (!/^https:\/\/[a-z0-9.-]+\.vaanforge\.com$|^https:\/\/vaanforge\.com$/i.test(value)) {
      throw new Error(`${name} must be an approved HTTPS VaanForge domain in production.`);
    }
  }
}

validateProductionEnv();

function csv(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
