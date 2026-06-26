export const coreRoles = [
  "Founder",
  "Co-founder",
  "CEO",
  "CTO",
  "COO",
  "CFO",
  "CMO",
  "HR",
  "Employee",
  "Developer",
  "Sales",
  "Support",
  "Legal",
  "CA",
  "Creator",
  "Partner",
  "Client",
  "Customer",
  "Viewer",
  "Admin",
  "Super Admin"
] as const;

export type CoreRole = (typeof coreRoles)[number];

export const permissionGroups = [
  "organization:manage",
  "workspace:create",
  "billing:manage",
  "finance:read",
  "finance:write",
  "hr:manage",
  "support:manage",
  "legal:manage",
  "compliance:manage",
  "reports:export",
  "settings:manage",
  "audit:read"
] as const;
