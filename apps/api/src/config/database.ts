import { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let prismaInstance: PrismaClient | null = null;

function getPrisma() {
    if (!prismaInstance) {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error("DATABASE_URL is not defined in environment variables");
        }

        const pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false,
            },
            family: 4,
        } as any);

        const adapter = new PrismaPg(pool);

        prismaInstance = new PrismaClient({
            adapter,
            log: ["error", "warn"],
        });
    }

    return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        return getPrisma()[prop as keyof PrismaClient];
    },
});
