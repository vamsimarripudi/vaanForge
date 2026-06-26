import { automationService } from "../modules/automation/automation.service";
import { authService } from "../modules/auth/auth.service";
import { communicationService } from "../modules/communication/communication.service";
import { complianceService } from "../modules/compliance/compliance.service";
import { env } from "../config/env";
import { crmService } from "../modules/crm/crm.service";
import { creatorsService } from "../modules/creators/creators.service";
import { financeService } from "../modules/finance/finance.service";
import { hrService } from "../modules/hr/hr.service";
import { intelligenceService } from "../modules/intelligence/intelligence.service";
import { legalService } from "../modules/legal/legal.service";
import { partnersService } from "../modules/partners/partners.service";
import { settingsService } from "../modules/settings/settings.service";
import { supportService } from "../modules/support/support.service";
import { tasksService } from "../modules/tasks/tasks.service";
import { workspacesService } from "../modules/workspaces/workspaces.service";

export type PersistenceMode = "memory" | "postgres";

export type ReadinessCheck = {
  key: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

const PLACEHOLDER_SECRET = "replace-with-secure-secret";
const PLACEHOLDER_VALUES = new Set(["", "placeholder", "example.com", "deterministic"]);

export class PersistenceService {
  mode(): PersistenceMode {
    return env.persistenceMode;
  }

  readiness() {
    const checks: ReadinessCheck[] = [
      this.persistenceCheck(),
      this.databaseUrlCheck(),
      this.jwtSecretCheck(),
      this.domainCheck(),
      this.frontendUrlCheck(),
      this.repositoryCheck(automationService.health()),
      this.repositoryCheck(authService.health()),
      this.repositoryCheck(communicationService.health()),
      this.repositoryCheck(complianceService.health()),
      this.repositoryCheck(crmService.health()),
      this.repositoryCheck(creatorsService.health()),
      this.repositoryCheck(financeService.health()),
      this.repositoryCheck(hrService.health()),
      this.repositoryCheck(intelligenceService.health()),
      this.repositoryCheck(legalService.health()),
      this.repositoryCheck(partnersService.health()),
      this.repositoryCheck(settingsService.health()),
      this.repositoryCheck(supportService.health()),
      this.repositoryCheck(tasksService.health()),
      this.repositoryCheck(workspacesService.health()),
      this.adapterCheck("memory-adapter", env.memoryAdapter),
      this.adapterCheck("realtime-adapter", env.realtimeAdapter),
      this.providerCheck("email-provider", env.emailProvider, ["local"]),
      this.providerCheck("sms-provider", env.smsProvider, ["local"]),
      this.providerCheck("storage-provider", env.s3Endpoint, ["local"]),
      this.providerCheck("ai-provider", env.aiProvider, ["deterministic"]),
      this.credentialPairCheck("payments-provider", env.razorpayKeyId, env.razorpayKeySecret, ["local"])
    ];

    const hasFailure = checks.some((check) => check.status === "fail");
    const hasWarning = checks.some((check) => check.status === "warn");

    return {
      status: hasFailure ? "not-ready" : hasWarning ? "limited" : "ready",
      mode: this.mode(),
      checks
    };
  }

  private persistenceCheck(): ReadinessCheck {
    if (this.mode() === "postgres") {
      return {
        key: "persistence-mode",
        status: "pass",
        message: "PostgreSQL persistence mode is selected."
      };
    }

    return {
      key: "persistence-mode",
      status: "warn",
      message: "Memory persistence is active. Use only for local demos and smoke tests."
    };
  }

  private databaseUrlCheck(): ReadinessCheck {
    if (!env.databaseUrl) {
      return {
        key: "database-url",
        status: "fail",
        message: "DATABASE_URL is required before enabling PostgreSQL persistence."
      };
    }

    if (env.databaseUrl.includes("postgres:postgres@localhost")) {
      return {
        key: "database-url",
        status: this.mode() === "postgres" ? this.productionStatus() : "pass",
        message: "DATABASE_URL points to the local development database."
      };
    }

    return {
      key: "database-url",
      status: "pass",
      message: "DATABASE_URL is configured."
    };
  }

  private jwtSecretCheck(): ReadinessCheck {
    if (!env.jwtSecret || env.jwtSecret.includes(PLACEHOLDER_SECRET)) {
      return {
        key: "jwt-secret",
        status: env.nodeEnv === "production" ? "fail" : "warn",
        message: "JWT_SECRET must be replaced with a strong production secret."
      };
    }

    return {
      key: "jwt-secret",
      status: "pass",
      message: "JWT_SECRET is configured."
    };
  }

  private domainCheck(): ReadinessCheck {
    if (this.placeholder(env.rootDomain) || env.rootDomain === "localhost") {
      return {
        key: "root-domain",
        status: this.productionStatus(),
        message: "ROOT_DOMAIN must be replaced with the final production domain."
      };
    }

    return {
      key: "root-domain",
      status: "pass",
      message: "ROOT_DOMAIN is configured."
    };
  }

  private frontendUrlCheck(): ReadinessCheck {
    if (!env.frontendUrl || env.frontendUrl.includes("localhost")) {
      return {
        key: "frontend-url",
        status: this.productionStatus(),
        message: "FRONTEND_URL still points to a local development origin."
      };
    }

    return {
      key: "frontend-url",
      status: "pass",
      message: "FRONTEND_URL is configured."
    };
  }

  private repositoryCheck(repository: { name: string; mode: string; durable: boolean }): ReadinessCheck {
    return {
      key: `${repository.name}-repository`,
      status: repository.durable ? "pass" : "warn",
      message: repository.durable
        ? `${repository.name} repository is durable in ${repository.mode} mode.`
        : `${repository.name} repository is writable but not durable in ${repository.mode} mode.`
    };
  }

  private adapterCheck(key: string, value: string): ReadinessCheck {
    if (this.placeholder(value) || value === "external") {
      return {
        key,
        status: this.productionStatus(),
        message: `${key} must be connected to a production adapter before launch.`
      };
    }

    return {
      key,
      status: "pass",
      message: `${key} is configured.`
    };
  }

  private providerCheck(key: string, value: string, devOnlyValues: string[] = []): ReadinessCheck {
    if (this.placeholder(value) || devOnlyValues.includes(value.trim().toLowerCase())) {
      return {
        key,
        status: this.productionStatus(),
        message: `${key} is still configured as a placeholder or development-only provider.`
      };
    }

    return {
      key,
      status: "pass",
      message: `${key} is configured.`
    };
  }

  private credentialPairCheck(key: string, publicValue: string, secretValue: string, devOnlyValues: string[] = []): ReadinessCheck {
    const publicNormalized = publicValue.trim().toLowerCase();
    const secretNormalized = secretValue.trim().toLowerCase();
    if (this.placeholder(publicValue) || this.placeholder(secretValue) || devOnlyValues.includes(publicNormalized) || devOnlyValues.includes(secretNormalized)) {
      return {
        key,
        status: this.productionStatus(),
        message: `${key} requires production public and secret credentials.`
      };
    }

    return {
      key,
      status: "pass",
      message: `${key} credentials are configured.`
    };
  }

  private placeholder(value: string | undefined): boolean {
    return !value || PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
  }

  private productionStatus(): "warn" | "fail" {
    return env.nodeEnv === "production" ? "fail" : "warn";
  }
}

export const persistenceService = new PersistenceService();
