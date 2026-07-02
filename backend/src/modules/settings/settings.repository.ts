import type { SettingsInput } from "@kravia/shared/growth";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma-client";
import { store, type StoredSettings } from "../../database/in-memory-store";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export interface SettingsRepository {
  get(organizationId: string): Promise<StoredSettings> | StoredSettings;
  update(input: SettingsInput): Promise<StoredSettings> | StoredSettings;
  health(): RepositoryHealth;
}

export class MemorySettingsRepository implements SettingsRepository {
  get(organizationId: string) {
    let settings = store.settings.find((item) => item.organizationId === organizationId);
    if (!settings) {
      settings = {
        organizationId,
        themeMode: "system",
        notificationEmail: true,
        notificationSms: false,
        apiKeysConfigured: false,
        updatedAt: new Date().toISOString()
      };
      store.settings.push(settings);
    }
    return settings;
  }

  update(input: SettingsInput) {
    const current = this.get(input.organizationId);
    current.themeMode = input.themeMode;
    current.billingEmail = input.billingEmail;
    current.notificationEmail = Boolean(input.notificationEmail);
    current.notificationSms = Boolean(input.notificationSms);
    current.updatedAt = new Date().toISOString();
    return current;
  }

  health(): RepositoryHealth {
    return {
      name: "settings",
      mode: "memory",
      writable: true,
      durable: false
    };
  }
}

export class PrismaSettingsRepository implements SettingsRepository {
  async get(organizationId: string) {
    const settings = await prisma().organizationSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        themeMode: "system",
        notificationEmail: true,
        notificationSms: false,
        apiKeysConfigured: false
      },
      update: {}
    });

    return this.toStoredSettings(settings);
  }

  async update(input: SettingsInput) {
    const settings = await prisma().organizationSettings.upsert({
      where: { organizationId: input.organizationId },
      create: {
        organizationId: input.organizationId,
        themeMode: input.themeMode,
        billingEmail: input.billingEmail,
        notificationEmail: Boolean(input.notificationEmail),
        notificationSms: Boolean(input.notificationSms),
        apiKeysConfigured: false
      },
      update: {
        themeMode: input.themeMode,
        billingEmail: input.billingEmail,
        notificationEmail: Boolean(input.notificationEmail),
        notificationSms: Boolean(input.notificationSms)
      }
    });

    return this.toStoredSettings(settings);
  }

  health(): RepositoryHealth {
    return {
      name: "settings",
      mode: "postgres",
      writable: true,
      durable: true
    };
  }

  private toStoredSettings(settings: {
    organizationId: string;
    themeMode: string;
    billingEmail: string | null;
    notificationEmail: boolean;
    notificationSms: boolean;
    apiKeysConfigured: boolean;
    updatedAt: Date;
  }): StoredSettings {
    return {
      organizationId: settings.organizationId,
      themeMode: this.themeMode(settings.themeMode),
      billingEmail: settings.billingEmail ?? undefined,
      notificationEmail: settings.notificationEmail,
      notificationSms: settings.notificationSms,
      apiKeysConfigured: settings.apiKeysConfigured,
      updatedAt: settings.updatedAt.toISOString()
    };
  }

  private themeMode(value: string): StoredSettings["themeMode"] {
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  }
}

export const settingsRepository: SettingsRepository =
  env.persistenceMode === "postgres" ? new PrismaSettingsRepository() : new MemorySettingsRepository();
