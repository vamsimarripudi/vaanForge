import { coreRoles, type CoreRole } from "@vmnexus/shared/roles";
import { env } from "../../config/env";
import { createId, store, type StoredPasswordResetToken, type StoredUser } from "../../database/in-memory-store";
import { prisma } from "../../database/prisma-client";
import type { RepositoryHealth } from "../../database/repositories/repository-contracts";

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: CoreRole;
};

export type CreatePasswordResetTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: string;
};

export interface AuthRepository {
  create(input: CreateUserInput): Promise<StoredUser> | StoredUser;
  findByEmail(email: string): Promise<StoredUser | undefined> | StoredUser | undefined;
  findById(userId: string): Promise<StoredUser | undefined> | StoredUser | undefined;
  assignOrganization(userId: string, organizationId: string): Promise<StoredUser | undefined> | StoredUser | undefined;
  updatePassword(userId: string, passwordHash: string): Promise<StoredUser | undefined> | StoredUser | undefined;
  createPasswordResetToken(input: CreatePasswordResetTokenInput): Promise<StoredPasswordResetToken> | StoredPasswordResetToken;
  findPasswordResetToken(tokenHash: string): Promise<StoredPasswordResetToken | undefined> | StoredPasswordResetToken | undefined;
  consumePasswordResetToken(tokenId: string): Promise<StoredPasswordResetToken | undefined> | StoredPasswordResetToken | undefined;
  health(): { name: string; mode: "memory" | "postgres"; writable: boolean; durable: boolean };
}

export class MemoryAuthRepository implements AuthRepository {
  create(input: CreateUserInput) {
    const user = {
      id: createId("usr"),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: new Date().toISOString()
    };
    store.users.push(user);
    return user;
  }

  findByEmail(email: string) {
    return store.users.find((user) => user.email === email);
  }

  findById(userId: string) {
    return store.users.find((user) => user.id === userId);
  }

  assignOrganization(userId: string, organizationId: string) {
    const user = this.findById(userId);
    if (user) {
      user.organizationId = organizationId;
    }
    return user;
  }

  updatePassword(userId: string, passwordHash: string) {
    const user = this.findById(userId);
    if (user) {
      user.passwordHash = passwordHash;
    }
    return user;
  }

  createPasswordResetToken(input: CreatePasswordResetTokenInput) {
    const token = {
      id: createId("prt"),
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: new Date().toISOString()
    };
    store.passwordResetTokens.push(token);
    return token;
  }

  findPasswordResetToken(tokenHash: string) {
    return store.passwordResetTokens.find((token) => token.tokenHash === tokenHash);
  }

  consumePasswordResetToken(tokenId: string) {
    const token = store.passwordResetTokens.find((item) => item.id === tokenId);
    if (token) {
      token.consumedAt = new Date().toISOString();
    }
    return token;
  }

  health() {
    return { name: "auth", mode: "memory" as const, writable: true, durable: false };
  }
}

export class PrismaAuthRepository implements AuthRepository {
  async create(input: CreateUserInput) {
    const user = await prisma().user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role
      }
    });
    return this.toStoredUser(user);
  }

  async findByEmail(email: string) {
    const user = await prisma().user.findUnique({ where: { email } });
    return user ? this.toStoredUser(user) : undefined;
  }

  async findById(userId: string) {
    const user = await prisma().user.findUnique({ where: { id: userId } });
    return user ? this.toStoredUser(user) : undefined;
  }

  async assignOrganization(userId: string, organizationId: string) {
    try {
      const user = await prisma().user.update({ where: { id: userId }, data: { organizationId } });
      return this.toStoredUser(user);
    } catch {
      return undefined;
    }
  }

  async updatePassword(userId: string, passwordHash: string) {
    try {
      const user = await prisma().user.update({ where: { id: userId }, data: { passwordHash } });
      return this.toStoredUser(user);
    } catch {
      return undefined;
    }
  }

  async createPasswordResetToken(input: CreatePasswordResetTokenInput) {
    const token = await prisma().passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: new Date(input.expiresAt)
      }
    });
    return this.toStoredPasswordResetToken(token);
  }

  async findPasswordResetToken(tokenHash: string) {
    const token = await prisma().passwordResetToken.findUnique({ where: { tokenHash } });
    return token ? this.toStoredPasswordResetToken(token) : undefined;
  }

  async consumePasswordResetToken(tokenId: string) {
    try {
      const token = await prisma().passwordResetToken.update({ where: { id: tokenId }, data: { consumedAt: new Date() } });
      return this.toStoredPasswordResetToken(token);
    } catch {
      return undefined;
    }
  }

  health() {
    return { name: "auth", mode: "postgres" as const, writable: true, durable: true };
  }

  private toStoredUser(user: PrismaUser): StoredUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: this.role(user.role),
      organizationId: user.organizationId ?? undefined,
      createdAt: user.createdAt.toISOString()
    };
  }

  private role(value: string): CoreRole {
    return coreRoles.includes(value as CoreRole) ? (value as CoreRole) : "Founder";
  }

  private toStoredPasswordResetToken(token: PrismaPasswordResetToken): StoredPasswordResetToken {
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt.toISOString(),
      consumedAt: token.consumedAt?.toISOString(),
      createdAt: token.createdAt.toISOString()
    };
  }
}

type PrismaUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  organizationId: string | null;
  role: string;
  createdAt: Date;
};

type PrismaPasswordResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

export const authRepository: AuthRepository = env.persistenceMode === "postgres" ? new PrismaAuthRepository() : new MemoryAuthRepository();
