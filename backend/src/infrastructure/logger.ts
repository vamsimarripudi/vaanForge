type LogLevel = "debug" | "info" | "warn" | "error";

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function configuredLevel(): LogLevel {
  if (process.env.NODE_ENV === "test") return "error";
  return process.env.NODE_ENV === "production" ? "info" : "warn";
}

function sanitize(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => {
      if (/secret|token|password|api[_-]?key|signature/i.test(key)) return [key, "[masked]"];
      return [key, sanitize(item)];
    })
  );
}

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  if (levels[level] < levels[configuredLevel()]) return;
  const payload = metadata ? ` ${JSON.stringify(sanitize(metadata))}` : "";
  const line = `[${level.toUpperCase()}] ${message}${payload}`;
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, metadata?: Record<string, unknown>) => write("debug", message, metadata),
  info: (message: string, metadata?: Record<string, unknown>) => write("info", message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => write("warn", message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => write("error", message, metadata)
};
