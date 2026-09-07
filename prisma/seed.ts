import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@example.com',
      passwordHash: userHash,
      role: 'USER',
    },
  });

  const products = [
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with silent clicks',
      price: new Prisma.Decimal(24.99),
      stock: 50,
    },
    {
      name: 'Mechanical Keyboard',
      description: 'Tenkeyless mechanical keyboard with blue switches',
      price: new Prisma.Decimal(89.5),
      stock: 25,
    },
    {
      name: 'USB-C Hub',
      description: '7-in-1 USB-C hub with HDMI and card reader',
      price: new Prisma.Decimal(35.0),
      stock: 80,
    },
    {
      name: '27 Inch Monitor',
      description: 'QHD IPS monitor with 144Hz refresh rate',
      price: new Prisma.Decimal(259.99),
      stock: 12,
    },
    {
      name: 'Laptop Stand',
      description: 'Aluminum adjustable laptop stand',
      price: new Prisma.Decimal(18.75),
      stock: 100,
    },
    {
      name: 'Webcam 1080p',
      description: 'Full HD webcam with built-in microphone',
      price: new Prisma.Decimal(49.99),
      stock: 40,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('Seed finished');
  console.log(`Admin account: ${admin.email} / admin123`);
  console.log(`User account: ${regularUser.email} / user123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });