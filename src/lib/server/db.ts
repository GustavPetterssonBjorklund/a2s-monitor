import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '$env/dynamic/private';
import { PrismaClient } from '$lib/server/generated/prisma/client';

const PRISMA_CLIENT_SCHEMA_VERSION = 'service-status-v1';

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
	prismaSchemaVersion?: string;
};

const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });

if (
	process.env.NODE_ENV !== 'production' &&
	globalForPrisma.prisma &&
	globalForPrisma.prismaSchemaVersion !== PRISMA_CLIENT_SCHEMA_VERSION
) {
	void globalForPrisma.prisma.$disconnect();
	globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
	globalForPrisma.prismaSchemaVersion = PRISMA_CLIENT_SCHEMA_VERSION;
}
