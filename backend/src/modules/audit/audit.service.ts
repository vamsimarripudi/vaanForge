export type AuditAction =
  | "FINANCE_ACTION"
  | "LEGAL_ACTION"
  | "SECURITY_ACTION"
  | "BILLING_ACTION"
  | "ENTITLEMENT_CHECK"
  | "WORKSPACE_CREATED"
  | "PERMISSION_CHECK"
  | "SETTINGS_CHANGED"
  | "AUTOMATION_CHANGED"
  | "FILE_UPLOADED"
  | "VAANFORGE_AGENT_RUN";

export interface AuditLogInput {
  actorId: string;
  organizationId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry extends AuditLogInput {
  id: string;
  createdAt: string;
}

export class AuditService {
  private readonly logs: AuditLogEntry[] = [];

  record(input: AuditLogInput) {
    const entry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      createdAt: new Date().toISOString()
    };
    this.logs.push(entry);
    return entry;
  }

  list(filters: { organizationId?: string; action?: AuditAction } = {}) {
    return this.logs.filter((entry) => {
      if (filters.organizationId && entry.organizationId !== filters.organizationId) {
        return false;
      }
      if (filters.action && entry.action !== filters.action) {
        return false;
      }
      return true;
    });
  }

  summary(organizationId?: string) {
    const logs = this.list({ organizationId });
    return {
      total: logs.length,
      finance: logs.filter((entry) => entry.action === "FINANCE_ACTION").length,
      legal: logs.filter((entry) => entry.action === "LEGAL_ACTION").length,
      security: logs.filter((entry) => entry.action === "SECURITY_ACTION").length,
      workspace: logs.filter((entry) => entry.action === "WORKSPACE_CREATED").length,
      vaanforge: logs.filter((entry) => entry.action === "VAANFORGE_AGENT_RUN").length
    };
  }
}

export const auditService = new AuditService();
