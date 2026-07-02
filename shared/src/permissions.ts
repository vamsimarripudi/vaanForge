import type { CoreRole } from "./roles";

export const rolePermissions: Record<CoreRole, string[]> = {
  Founder: [
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
    "profile:manage",
    "support:create",
    "api-keys:manage",
    "settings:manage",
    "audit:read"
  ],
  "Co-founder": ["organization:manage", "workspace:create", "finance:read", "reports:export", "settings:manage"],
  CEO: ["organization:manage", "finance:read", "hr:manage", "support:manage", "reports:export"],
  CTO: ["workspace:create", "settings:manage", "reports:export", "api-keys:manage"],
  COO: ["organization:manage", "hr:manage", "support:manage", "reports:export"],
  CFO: ["billing:manage", "finance:read", "finance:write", "reports:export", "audit:read"],
  CMO: ["reports:export"],
  HR: ["hr:manage", "reports:export"],
  Employee: [],
  Developer: ["workspace:create", "profile:manage", "support:create", "api-keys:manage"],
  Sales: ["reports:export"],
  Support: ["support:manage", "support:create"],
  Legal: ["legal:manage", "audit:read"],
  CA: ["finance:read", "reports:export", "audit:read"],
  Creator: [],
  Partner: [],
  Client: [],
  Customer: ["profile:manage", "support:create"],
  Viewer: [],
  Admin: ["organization:manage", "workspace:create", "settings:manage", "audit:read", "profile:manage", "support:create", "api-keys:manage"],
  "Super Admin": [
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
    "profile:manage",
    "support:create",
    "api-keys:manage",
    "settings:manage",
    "audit:read"
  ]
};

export const roleHasPermission = (role: CoreRole, permission: string) => {
  return rolePermissions[role]?.includes(permission) ?? false;
};
