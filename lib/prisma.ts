import "dotenv/config";
import { Pool } from "pg";                           // 👈 import Pool
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    // 1. Create a pg Pool with the connection string and a max limit
    const pool = new Pool({
      connectionString: `${process.env.DATABASE_URL}`,
      max: 3,            // 👈 only 3 connections per pool
    });

    // 2. Pass the Pool instance to the adapter
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter });

    // 3. Cache for hot‑reloads and serverless reuse
    globalForPrisma.prisma = client;
    return client;
  })();