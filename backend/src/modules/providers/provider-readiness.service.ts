import { env } from "../../config/env";
import { providerReadinessCatalog, type ProviderDefinition } from "../../config/provider-readiness.catalog";
import { createId, store, type StoredProviderHealthStatus } from "../../database/in-memory-store";
import { auditService } from "../audit/audit.service";

type Actor = { organizationId: string; userId: string; role: string };

export class ProviderReadinessService {
  list() {
    return providerReadinessCatalog.map((definition) => this.snapshot(definition));
  }

  readiness() {
    const items = this.list();
    return {
      environment: env.nodeEnv,
      parameterStore: {
        required: env.nodeEnv === "production" && !env.allowLocalEnvInProduction,
        enabled: env.parameterStoreEnabled,
        prefix: env.parameterStorePrefix,
        mode: env.allowLocalEnvInProduction ? "local-env-allowed" : "parameter-store-required"
      },
      totals: {
        providers: items.length,
        healthy: items.filter((item) => item.status === "healthy").length,
        missingSecret: items.filter((item) => item.status === "missing_secret").length,
        notConfigured: items.filter((item) => item.status === "not_configured").length
      },
      providers: items
    };
  }

  healthCheck(actor: Actor, providerKey: string) {
    const definition = providerReadinessCatalog.find((item) => item.key === providerKey);
    if (!definition) throw new Error("Provider is not registered.");
    const snapshot = this.snapshot(definition);
    const now = new Date().toISOString();
    const check = {
      id: createId("phc"),
      checkId: createId("provider_health"),
      provider: definition.key,
      status: snapshot.status,
      environment: env.nodeEnv,
      configured: snapshot.configured,
      missingParameterStorePaths: snapshot.missingParameterStorePaths,
      message: snapshot.safeMessage,
      checkedBy: actor.userId,
      createdAt: now
    };
    store.providerHealthChecks.push(check);
    auditService.record({
      actorId: actor.userId,
      organizationId: actor.organizationId,
      action: "SECURITY_ACTION",
      entityType: "ProviderHealthCheck",
      entityId: check.checkId,
      metadata: { provider: definition.key, status: check.status, environment: check.environment }
    });
    return { ...snapshot, lastHealthCheck: check };
  }

  private snapshot(definition: ProviderDefinition) {
    const values = definition.envNames.map((name) => ({ name, configured: configured(process.env[name]), maskedValue: mask(process.env[name]) }));
    const configuredCount = values.filter((item) => item.configured).length;
    const configuredAll = configuredCount === definition.envNames.length;
    const configuredAny = configuredCount > 0;
    const missingParameterStorePaths = this.missingParameterPaths(definition, values);
    const status = this.status(definition, configuredAll, configuredAny, missingParameterStorePaths);
    const lastHealthCheck = store.providerHealthChecks.filter((item) => item.provider === definition.key).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return {
      provider: definition.key,
      label: definition.label,
      environment: env.nodeEnv,
      status,
      configured: configuredAll,
      requiredInProduction: definition.requiredInProduction,
      env: values,
      missingParameterStorePaths,
      lastHealthCheck,
      safeMessage: this.message(status, definition),
      nextSetupAction: definition.nextSetupAction
    };
  }

  private missingParameterPaths(definition: ProviderDefinition, values: Array<{ configured: boolean }>) {
    if (!env.parameterStoreEnabled) return definition.parameterPaths;
    return definition.parameterPaths.filter((_path, index) => !values[index]?.configured);
  }

  private status(definition: ProviderDefinition, configuredAll: boolean, configuredAny: boolean, missingPaths: string[]): StoredProviderHealthStatus {
    if (configuredAll && (!env.parameterStoreEnabled || missingPaths.length === 0)) return "healthy";
    if (env.nodeEnv === "production" && definition.requiredInProduction && missingPaths.length > 0) return "missing_secret";
    if (configuredAny) return "degraded";
    return definition.requiredInProduction ? "missing_secret" : "not_configured";
  }

  private message(status: StoredProviderHealthStatus, definition: ProviderDefinition) {
    if (status === "healthy") return `${definition.label} is configured. Secret values are masked.`;
    if (status === "missing_secret") return `${definition.label} is missing required production configuration.`;
    if (status === "degraded") return `${definition.label} is partially configured. Complete missing values before production use.`;
    if (status === "not_configured") return `${definition.label} is optional and not configured.`;
    return `${definition.label} readiness is ${status}.`;
  }
}

function configured(value: string | undefined) {
  return Boolean(value && !/placeholder|replace-with|^local$|postgres:postgres|deterministic/i.test(value));
}

function mask(value: string | undefined) {
  if (!configured(value)) return undefined;
  return `${value!.slice(0, 3)}...${value!.slice(-3)}`;
}

export const providerReadinessService = new ProviderReadinessService();
