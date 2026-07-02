const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const routesPath = path.join(rootDir, "backend", "src", "routes.ts");
const filesRoutesPath = path.join(rootDir, "backend", "src", "modules", "files", "files.routes.ts");
const filesServicePath = path.join(rootDir, "backend", "src", "modules", "files", "files.service.ts");
const storageServicePath = path.join(rootDir, "backend", "src", "infrastructure", "storage", "storage.service.ts");
const apiDocPath = path.join(rootDir, "docs", "API.md");
const backendDocPath = path.join(rootDir, "docs", "BACKEND.md");
const workspacePath = path.join(rootDir, "frontend", "src", "app", "Workspace.tsx");
const apiClientPath = path.join(rootDir, "frontend", "src", "services", "apiClient.ts");

const routes = fs.readFileSync(routesPath, "utf8");
const filesRoutes = fs.readFileSync(filesRoutesPath, "utf8");
const filesService = fs.readFileSync(filesServicePath, "utf8");
const storageService = fs.readFileSync(storageServicePath, "utf8");
const apiDoc = fs.readFileSync(apiDocPath, "utf8");
const backendDoc = fs.readFileSync(backendDocPath, "utf8");
const workspace = fs.readFileSync(workspacePath, "utf8");
const apiClient = fs.readFileSync(apiClientPath, "utf8");
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

for (const required of ["Generated files", "File versions", "No silent overwrite", "Review status", "Repair links"]) {
  if (!workspace.includes(required)) {
    failures.push(`Workspace file workflow surface must include ${required}`);
  }
}

for (const required of ["API_BASE_URL", "credentials: \"include\"", "content-type", "ApiError"]) {
  if (!apiClient.includes(required)) failures.push(`apiClient.ts must include ${required}`);
}

if (failures.length) {
  console.error(`File upload contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("File upload contract check passed for storage-backed uploads.");
