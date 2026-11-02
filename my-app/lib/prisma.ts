import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import pg from 'pg'

// 2. 显式传入连接串，避免 Prisma 回退到默认值
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL 
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
  adapter, // 3. 必须传入 adapter
  log: ['error', 'warn'] 
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma