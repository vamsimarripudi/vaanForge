import { coreRoles } from "@vmnexus/shared/roles";
import { rolePermissions, roleHasPermission } from "@vmnexus/shared/permissions";
import type { CoreRole } from "@vmnexus/shared/roles";

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
