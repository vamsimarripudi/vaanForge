export interface MemoryAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  publish(channel: string, payload: unknown): Promise<void>;
  enqueue(queueName: string, payload: unknown): Promise<void>;
  rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }>;
}
