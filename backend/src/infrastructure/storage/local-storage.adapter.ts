import type { StoredObject, StoredObjectInput, StorageProvider } from "./storage.interface";

export const localStorageObjects = new Map<string, StoredObjectInput & { createdAt: string }>();

export class LocalStorageAdapter implements StorageProvider {
  async putObject(input: StoredObjectInput): Promise<StoredObject> {
    localStorageObjects.set(input.key, { ...input, createdAt: new Date().toISOString() });
    return {
      provider: "local",
      key: input.key,
      url: `local://storage/${input.key}`
    };
  }
}
