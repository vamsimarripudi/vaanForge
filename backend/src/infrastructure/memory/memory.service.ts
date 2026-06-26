import { env } from "../../config/env";
import type { MemoryAdapter } from "./memory.interface";
import { RedisMemoryAdapter } from "./redis.adapter";
import { VaanisMemoryAdapter } from "./vaanis.adapter";

const adapter: MemoryAdapter = env.memoryAdapter === "vaanis" ? new VaanisMemoryAdapter() : new RedisMemoryAdapter();

export class MemoryService implements MemoryAdapter {
  get<T>(key: string) {
    return adapter.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds?: number) {
    return adapter.set(key, value, ttlSeconds);
  }

  publish(channel: string, payload: unknown) {
    return adapter.publish(channel, payload);
  }

  enqueue(queueName: string, payload: unknown) {
    return adapter.enqueue(queueName, payload);
  }

  rateLimit(key: string, limit: number, windowSeconds: number) {
    return adapter.rateLimit(key, limit, windowSeconds);
  }
}

export const memoryService = new MemoryService();
