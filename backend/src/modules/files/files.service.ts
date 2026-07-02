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
const maxUploadBytes = 5 * 1024 * 1024;
const allowedMimeByExtension: Record<string, string[]> = {
  ".txt": ["text/plain"],
  ".csv": ["text/csv", "application/csv"],
  ".json": ["application/json"],
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"]
};

export class FilesService {
  async upload(input: FileUploadInput) {
    const content = this.decodeBase64(input.contentBase64);
    this.validateUpload(input.fileName, input.mimeType, content.byteLength);
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

  private decodeBase64(contentBase64: string) {
    if (!/^[A-Za-z0-9+/=_-]+$/.test(contentBase64)) {
      throw new Error("File content must be valid base64.");
    }
    const content = Buffer.from(contentBase64, "base64");
    if (!content.length || content.toString("base64").replace(/=+$/, "") !== contentBase64.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/")) {
      throw new Error("File content must be valid base64.");
    }
    return content;
  }

  private validateUpload(fileName: string, mimeType: string, sizeBytes: number) {
    if (sizeBytes > maxUploadBytes) {
      throw new Error("File exceeds the 5 MB upload limit.");
    }
    const normalizedName = fileName.toLowerCase();
    const extension = Object.keys(allowedMimeByExtension).find((item) => normalizedName.endsWith(item));
    if (!extension) {
      throw new Error("File extension is not allowed.");
    }
    if (!allowedMimeByExtension[extension].includes(mimeType.toLowerCase())) {
      throw new Error("File MIME type does not match the allowed extension policy.");
    }
  }
}

export const filesService = new FilesService();
