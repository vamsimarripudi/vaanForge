const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

export const prisma = () => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    const { PrismaClient } = require("@prisma/client") as { PrismaClient: new () => any };
    const client = new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  } catch (error) {
    throw new Error(
      `Prisma Client is not generated or is unavailable. Run Prisma generation with a complete install before using PERSISTENCE_MODE=postgres. Cause: ${(error as Error).message}`
    );
  }
};
