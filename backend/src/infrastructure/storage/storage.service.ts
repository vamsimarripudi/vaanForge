import { env } from "../../config/env";
import { LocalStorageAdapter } from "./local-storage.adapter";
import { S3StorageAdapter } from "./s3-storage.adapter";
import type { StoredObject, StoredObjectInput, StorageProvider } from "./storage.interface";

const provider: StorageProvider = env.s3Endpoint === "local" ? new LocalStorageAdapter() : new S3StorageAdapter();

export class StorageService implements StorageProvider {
  putObject(input: StoredObjectInput): Promise<StoredObject> {
    return provider.putObject(input);
  }
}

export const storageService = new StorageService();
