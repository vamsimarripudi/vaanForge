import type { MemoryAdapter } from "./memory.interface";

export class VaanisMemoryAdapter implements MemoryAdapter {
  async get<T>(_key: string): Promise<T | null> {
    throw new Error("Vaanis adapter is a placeholder until the VM nexus-owned memory engine is ready.");
  }

  async set<T>(_key: string, _value: T): Promise<void> {
    throw new Error("Vaanis adapter is a placeholder until the VM nexus-owned memory engine is ready.");
  }

  async publish(_channel: string, _payload: unknown): Promise<void> {
    throw new Error("Vaanis adapter is a placeholder until the VM nexus-owned memory engine is ready.");
  }

  async enqueue(_queueName: string, _payload: unknown): Promise<void> {
    throw new Error("Vaanis adapter is a placeholder until the VM nexus-owned memory engine is ready.");
  }

  async rateLimit(_key: string, _limit: number, _windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    throw new Error("Vaanis adapter is a placeholder until the VM nexus-owned memory engine is ready.");
  }
}
