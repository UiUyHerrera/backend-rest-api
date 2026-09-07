import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

export default async function globalSetup() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('TEST_DATABASE_URL is required to run tests');
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });

  const prisma = new PrismaClient({
    datasources: {
      db: { url: testUrl },
    },
  });
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "OrderItem", "Order", "Product", "User" RESTART IDENTITY CASCADE');
  await prisma.$disconnect();
}