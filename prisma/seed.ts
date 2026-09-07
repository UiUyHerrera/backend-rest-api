import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const products = [
  { name: 'Teclado', description: 'Teclado mecánico', price: new Prisma.Decimal(59.9), stock: 25 },
  { name: 'Mouse', description: 'Mouse inalámbrico', price: new Prisma.Decimal(19.9), stock: 50 },
  { name: 'Notebook', description: 'Notebook 15 pulgadas', price: new Prisma.Decimal(499.99), stock: 10 },
  { name: 'Monitor', description: 'Monitor 27 pulgadas', price: new Prisma.Decimal(179.99), stock: 12 },
  { name: 'Televisor', description: 'Televisor 4K 50 pulgadas', price: new Prisma.Decimal(329.99), stock: 8 },
  { name: 'Webcam', description: 'Webcam con micrófono', price: new Prisma.Decimal(29.99), stock: 40 },
  { name: 'Cargador', description: 'Cargador USB-C', price: new Prisma.Decimal(15.99), stock: 60 },
  { name: 'Auriculares', description: 'Auriculares con micrófono', price: new Prisma.Decimal(25.99), stock: 35 },
];

async function upsertUser(email: string, data: { name: string; passwordHash: string; role: 'ADMIN' | 'USER' }) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      ...data,
    },
  });
}

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('cliente123', 10);

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const admin = await upsertUser('camila@shop.com', {
    name: 'Camila Ruiz',
    passwordHash: adminHash,
    role: 'ADMIN',
  });

  const regularUser = await upsertUser('jorge@shop.com', {
    name: 'Jorge Medina',
    passwordHash: userHash,
    role: 'USER',
  });

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('Seed finished');
  console.log(`Admin account: ${admin.email} / admin123`);
  console.log(`User account: ${regularUser.email} / cliente123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });