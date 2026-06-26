import { createHash } from "crypto";
import { storageService } from "../../infrastructure/storage/storage.service";

export type FileUploadInput = {
  organizationId: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  folder?: string;
  tags?: string[];
  version?: number;
  expiresAt?: string;
  documentType?: string;
};

const sanitizeSegment = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");

export class FilesService {
  async upload(input: FileUploadInput) {
    const content = Buffer.from(input.contentBase64, "base64");
    const checksum = createHash("sha256").update(content).digest("hex");
    const safeFolder = sanitizeSegment(input.folder || "general");
    const safeFileName = sanitizeSegment(input.fileName);
    const key = `uploads/${input.organizationId}/${safeFolder}/${Date.now()}-${safeFileName}`;
    const storedObject = await storageService.putObject({
      key,
      content: input.contentBase64,
      mimeType: input.mimeType
    });

    return {
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: content.byteLength,
      checksum,
      storageProvider: storedObject.provider,
      storageKey: storedObject.key,
      storageUrl: storedObject.url,
      folder: safeFolder,
      tags: input.tags || [],
      version: input.version || 1,
      expiresAt: input.expiresAt,
      documentType: input.documentType || "GENERAL",
      expiryReminder: input.expiresAt ? `Reminder required before ${input.expiresAt}` : "No expiry reminder"
    };
  }
}

export const filesService = new FilesService();
