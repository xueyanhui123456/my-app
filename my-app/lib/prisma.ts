import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// 1. 在 Node.js 环境中，需要指定 WebSocket 实现
neonConfig.webSocketConstructor = ws;

// 2. 使用连接字符串创建 Neon 适配器
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });


// 3. 将适配器传入 Prisma Client
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;