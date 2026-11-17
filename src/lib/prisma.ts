import { PrismaClient } from "@prisma/client";

const isVercel = Boolean(process.env.VERCEL);
const rawUrl = process.env.DATABASE_URL;

const resolvedDatabaseUrl =
  isVercel && (!rawUrl || rawUrl.startsWith("file:./"))
    ? "file:/tmp/dev.db"
    : rawUrl || "file:./dev.db";

process.env.DATABASE_URL = resolvedDatabaseUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDatabaseUrl,
      },
    },
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
