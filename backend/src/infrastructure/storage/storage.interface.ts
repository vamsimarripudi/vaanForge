export type StoredObjectInput = {
  key: string;
  content: string;
  mimeType: string;
};

export type StoredObject = {
  provider: string;
  key: string;
  url: string;
};

export interface StorageProvider {
  putObject(input: StoredObjectInput): Promise<StoredObject>;
}
