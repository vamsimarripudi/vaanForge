const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const routesPath = path.join(rootDir, "backend", "src", "routes.ts");
const filesRoutesPath = path.join(rootDir, "backend", "src", "modules", "files", "files.routes.ts");
const filesServicePath = path.join(rootDir, "backend", "src", "modules", "files", "files.service.ts");
const storageServicePath = path.join(rootDir, "backend", "src", "infrastructure", "storage", "storage.service.ts");
const apiDocPath = path.join(rootDir, "docs", "API.md");
const backendDocPath = path.join(rootDir, "docs", "BACKEND.md");
const frontendDocPath = path.join(rootDir, "docs", "FRONTEND.md");
const uploadPanelPath = path.join(rootDir, "frontend", "src", "features", "files", "components", "FileUploadPanel.tsx");
const settingsPagePath = path.join(rootDir, "frontend", "src", "app", "settings", "page.tsx");

const routes = fs.readFileSync(routesPath, "utf8");
const filesRoutes = fs.readFileSync(filesRoutesPath, "utf8");
const filesService = fs.readFileSync(filesServicePath, "utf8");
const storageService = fs.readFileSync(storageServicePath, "utf8");
const apiDoc = fs.readFileSync(apiDocPath, "utf8");
const backendDoc = fs.readFileSync(backendDocPath, "utf8");
const frontendDoc = fs.readFileSync(frontendDocPath, "utf8");
const uploadPanel = fs.readFileSync(uploadPanelPath, "utf8");
const settingsPage = fs.readFileSync(settingsPagePath, "utf8");
const failures = [];

for (const required of [
  'apiRouter.use("/files", filesRouter)',
  'filesRouter.post("/uploads", authMiddleware, requirePermission("organization:manage")',
  "contentBase64",
  "mimeType",
  "fileName",
  "documentType",
  "expiresAt",
  "tags",
  "version",
  "auditService.record",
  'action: "FILE_UPLOADED"',
  'entityType: "FileUpload"'
]) {
  if (!routes.includes(required) && !filesRoutes.includes(required)) {
    failures.push(`file upload route must include ${required}`);
  }
}

for (const required of ["storageService.putObject", "createHash", "sha256", "uploads/${input.organizationId}", "sizeBytes", "checksum", "expiryReminder", "documentType", "version"]) {
  if (!filesService.includes(required)) {
    failures.push(`files service must include ${required}`);
  }
}

if (!storageService.includes("S3StorageAdapter") || !storageService.includes("LocalStorageAdapter")) {
  failures.push("storage service must keep local and S3-compatible adapters");
}

for (const required of ["POST /api/v1/files/uploads", "contentBase64", "FILE_UPLOADED"]) {
  if (!apiDoc.includes(required) && !backendDoc.includes(required)) {
    failures.push(`API/backend docs must mention ${required}`);
  }
}

for (const required of [
  'apiClient<UploadedFile>("/files/uploads"',
  'apiClient<{ csrfToken: string }>("/security/csrf")',
  "FileReader",
  "contentBase64",
  "documentType",
  "expiresAt",
  "tags",
  "version",
  "Document OS Metadata",
  "Upload file",
  "checksum",
  "storageKey"
]) {
  if (!uploadPanel.includes(required)) {
    failures.push(`FileUploadPanel.tsx must include ${required}`);
  }
}

if (!settingsPage.includes("FileUploadPanel")) {
  failures.push("settings page must render FileUploadPanel");
}

for (const required of ["File uploads", "storage abstraction", "scripts/qa-file-upload-contract.js"]) {
  if (!frontendDoc.includes(required)) {
    failures.push(`FRONTEND.md must mention ${required}`);
  }
}

if (failures.length) {
  console.error(`File upload contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("File upload contract check passed for storage-backed uploads.");
