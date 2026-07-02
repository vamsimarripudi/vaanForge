const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const rolesPath = path.join(rootDir, "shared", "src", "roles.ts");
const permissionsPath = path.join(rootDir, "shared", "src", "permissions.ts");
const guardPath = path.join(rootDir, "backend", "src", "guards", "permission.guard.ts");
const rolesRoutesPath = path.join(rootDir, "backend", "src", "modules", "roles", "roles.routes.ts");
const modulesDir = path.join(rootDir, "backend", "src", "modules");
const docsPath = path.join(rootDir, "docs", "ROLES-PERMISSIONS.md");
const workspacePath = path.join(rootDir, "frontend", "src", "app", "Workspace.tsx");

const rolesSource = fs.readFileSync(rolesPath, "utf8");
const permissionsSource = fs.readFileSync(permissionsPath, "utf8");
const guardSource = fs.readFileSync(guardPath, "utf8");
const rolesRoutesSource = fs.readFileSync(rolesRoutesPath, "utf8");
const docsSource = fs.readFileSync(docsPath, "utf8");
const workspaceSource = fs.readFileSync(workspacePath, "utf8");

const failures = [];

function extractConstArray(source, name) {
  const match = source.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const;`));
  if (!match) {
    failures.push(`Missing exported const array ${name}`);
    return [];
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function listRouteFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listRouteFiles(entryPath);
    }
    return entry.name.endsWith(".routes.ts") ? [entryPath] : [];
  });
}

const coreRoles = extractConstArray(rolesSource, "coreRoles");
const permissionGroups = extractConstArray(rolesSource, "permissionGroups");
const rolePermissionEntries = [...permissionsSource.matchAll(/^\s{2}(?:"([^"]+)"|([A-Za-z]+)):\s*\[([\s\S]*?)\](?:,|\n)/gm)];
const rolePermissions = new Map(
  rolePermissionEntries.map((entry) => {
    const role = entry[1] ?? entry[2];
    const permissions = [...entry[3].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
    return [role, permissions];
  })
);

for (const role of coreRoles) {
  if (!rolePermissions.has(role)) {
    failures.push(`${role} is missing from rolePermissions`);
  }
}

for (const role of rolePermissions.keys()) {
  if (!coreRoles.includes(role)) {
    failures.push(`${role} is mapped in rolePermissions but is not a core role`);
  }
}

for (const [role, permissions] of rolePermissions.entries()) {
  for (const permission of permissions) {
    if (!permissionGroups.includes(permission)) {
      failures.push(`${role} references unknown permission ${permission}`);
    }
  }
}

for (const adminRole of ["Founder", "Super Admin"]) {
  const missing = permissionGroups.filter((permission) => !rolePermissions.get(adminRole)?.includes(permission));
  if (missing.length) {
    failures.push(`${adminRole} must include every permission group, missing ${missing.join(", ")}`);
  }
}

if (!permissionsSource.includes("export const roleHasPermission")) {
  failures.push("roleHasPermission must be exported from shared/src/permissions.ts");
}

if (!guardSource.includes('import { roleHasPermission } from "@kravia/shared/permissions"')) {
  failures.push("permission guard must use shared roleHasPermission");
}

if (!guardSource.includes("sendError(response, request, 403") || !guardSource.includes('code: "PERMISSION_DENIED"')) {
  failures.push("permission guard must deny unauthorized access with standardized 403 PERMISSION_DENIED response");
}

for (const filePath of listRouteFiles(modulesDir)) {
  const source = fs.readFileSync(filePath, "utf8");
  const permissionMatches = [...source.matchAll(/requirePermission\("([^"]+)"\)/g)].map((item) => item[1]);
  for (const permission of permissionMatches) {
    if (!permissionGroups.includes(permission)) {
      failures.push(`${path.relative(rootDir, filePath)} references unknown route permission ${permission}`);
    }
  }
}

if (!rolesRoutesSource.includes('rolesRouter.get("/", authMiddleware, requirePermission("settings:manage")')) {
  failures.push("roles list endpoint must require settings:manage");
}

if (!rolesRoutesSource.includes('rolesRouter.post("/check", authMiddleware')) {
  failures.push("roles permission check endpoint must require authentication");
}

if (!rolesRoutesSource.includes("z.enum(coreRoles)")) {
  failures.push("roles permission check endpoint must validate roles against coreRoles");
}

for (const requiredDocLine of [
  "Permission groups are defined in `shared/src/roles.ts`.",
  "Backend permission checks are mandatory.",
  "scripts/qa-roles-contract.js"
]) {
  if (!docsSource.includes(requiredDocLine)) {
    failures.push(`roles documentation must mention: ${requiredDocLine}`);
  }
}

for (const required of ["Workspace permissions", "Owner access", "Admin command center", "Security dashboard", "Platform settings"]) {
  if (!workspaceSource.includes(required)) {
    failures.push(`Workspace RBAC UI must include ${required}`);
  }
}

if (failures.length) {
  console.error(`Roles contract check failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Roles contract check passed for ${coreRoles.length} roles and ${permissionGroups.length} permissions.`);
