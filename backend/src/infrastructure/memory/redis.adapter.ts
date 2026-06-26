import type { MemoryAdapter } from "./memory.interface";

export class RedisMemoryAdapter implements MemoryAdapter {
  private readonly store = new Map<string, { value: unknown; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined });
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    console.log("Redis adapter publish placeholder", { channel, payload });
  }

  async enqueue(queueName: string, payload: unknown): Promise<void> {
    console.log("Redis adapter queue placeholder", { queueName, payload });
  }

  async rateLimit(key: string, limit: number): Promise<{ allowed: boolean; remaining: number }> {
    const current = Number((await this.get<number>(key)) || 0) + 1;
    await this.set(key, current);
    return { allowed: current <= limit, remaining: Math.max(limit - current, 0) };
  }
}
