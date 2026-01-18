// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as {
  prisma?: PrismaClient
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

  console.log("DB URL:", process.env.DATABASE_URL)

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
