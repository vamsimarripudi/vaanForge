import "dotenv/config";

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
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  rootDomain: process.env.ROOT_DOMAIN || "example.com",
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vmnexus",
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
  vformixAgentWebhookToken: process.env.VFORMIX_AGENT_WEBHOOK_TOKEN || "replace-with-vformix-agent-webhook-token"
};
