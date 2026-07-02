import { coreRoles } from "@kravia/shared/roles";
import { rolePermissions, roleHasPermission } from "@kravia/shared/permissions";
import type { CoreRole } from "@kravia/shared/roles";

export class RolesService {
  list() {
    return coreRoles.map((role) => ({
      role,
      permissions: rolePermissions[role],
      finalControl: role === "Founder" || role === "Super Admin"
    }));
  }

  check(role: CoreRole, permission: string) {
    return { role, permission, allowed: roleHasPermission(role, permission) };
  }
}

export const rolesService = new RolesService();
