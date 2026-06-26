import type { StoredObject, StoredObjectInput, StorageProvider } from "./storage.interface";

export class S3StorageAdapter implements StorageProvider {
  async putObject(_input: StoredObjectInput): Promise<StoredObject> {
    throw new Error("S3-compatible storage is not configured. Set S3_ENDPOINT and provider credentials before production launch.");
  }
}
