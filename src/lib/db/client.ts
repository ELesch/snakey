// Prisma 7 Client with PrismaPg Adapter
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Prisma 7 requires adapter at runtime
  // Configure with schema 'snakey' to match the Prisma schema definition
  // Also set connection pool timeouts for stability
  const adapter = new PrismaPg(
    {
      connectionString,
      connectionTimeoutMillis: 5_000, // 5 second connection timeout
      idleTimeoutMillis: 300_000, // 5 minute idle timeout
    },
    { schema: 'snakey' }
  )

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
