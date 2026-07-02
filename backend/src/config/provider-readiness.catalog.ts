export type ProviderKey =
  | "openai"
  | "gemini"
  | "claude"
  | "groq_together"
  | "hugging_face"
  | "razorpay"
  | "aws"
  | "s3"
  | "ses"
  | "postgresql"
  | "redis"
  | "sentry"
  | "analytics"
  | "figma_assets";

export type ProviderDefinition = {
  key: ProviderKey;
  label: string;
  envNames: string[];
  parameterPaths: string[];
  requiredInProduction: boolean;
  nextSetupAction: string;
};

export const providerReadinessCatalog: ProviderDefinition[] = [
  provider("openai", "OpenAI", ["OPENAI_API_KEY"], ["/vaanforge/prod/openai/api-key"], false, "Add OpenAI API key or keep AI provider disabled."),
  provider("gemini", "Gemini", ["GEMINI_API_KEY"], ["/vaanforge/prod/gemini/api-key"], false, "Add Gemini API key if Gemini model routing is enabled."),
  provider("claude", "Claude", ["ANTHROPIC_API_KEY"], ["/vaanforge/prod/anthropic/api-key"], false, "Add Anthropic API key if Claude routing is enabled."),
  provider("groq_together", "Groq/Together", ["GROQ_API_KEY", "TOGETHER_API_KEY"], ["/vaanforge/prod/groq/api-key", "/vaanforge/prod/together/api-key"], false, "Configure at least one fast inference provider if enabled."),
  provider("hugging_face", "Hugging Face", ["HUGGINGFACE_API_KEY"], ["/vaanforge/prod/huggingface/api-key"], false, "Add Hugging Face token for model or embedding workflows."),
  provider("razorpay", "Razorpay", ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"], ["/vaanforge/prod/razorpay/key-id", "/vaanforge/prod/razorpay/key-secret", "/vaanforge/prod/razorpay/webhook-secret"], true, "Load Razorpay credentials from Parameter Store."),
  provider("aws", "AWS", ["AWS_REGION"], ["/vaanforge/prod/aws/region"], true, "Configure AWS region and IAM role for production."),
  provider("s3", "S3", ["S3_ENDPOINT", "S3_BUCKET"], ["/vaanforge/prod/s3/endpoint", "/vaanforge/prod/s3/bucket"], true, "Configure S3-compatible object storage."),
  provider("ses", "SES", ["EMAIL_PROVIDER", "SES_FROM_EMAIL"], ["/vaanforge/prod/ses/provider", "/vaanforge/prod/ses/from-email"], false, "Configure SES when production email delivery is enabled."),
  provider("postgresql", "PostgreSQL", ["DATABASE_URL"], ["/vaanforge/prod/postgresql/database-url"], true, "Use production PostgreSQL, not local memory or local dev credentials."),
  provider("redis", "Redis", ["REDIS_URL", "MEMORY_ADAPTER"], ["/vaanforge/prod/redis/url"], true, "Configure Redis for queues, rate limits, and memory adapter."),
  provider("sentry", "Sentry", ["SENTRY_DSN"], ["/vaanforge/prod/sentry/dsn"], false, "Add Sentry DSN before enabling error monitoring."),
  provider("analytics", "Analytics", ["ANALYTICS_WRITE_KEY"], ["/vaanforge/prod/analytics/write-key"], false, "Configure analytics provider before enabling product analytics."),
  provider("figma_assets", "Figma asset readiness", ["FIGMA_ACCESS_TOKEN", "FIGMA_FILE_KEY"], ["/vaanforge/prod/figma/access-token", "/vaanforge/prod/figma/file-key"], false, "Connect Figma only when design asset sync is enabled.")
];

function provider(key: ProviderKey, label: string, envNames: string[], parameterPaths: string[], requiredInProduction: boolean, nextSetupAction: string): ProviderDefinition {
  return { key, label, envNames, parameterPaths, requiredInProduction, nextSetupAction };
}
