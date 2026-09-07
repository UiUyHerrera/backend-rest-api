import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const products = [
  {
    name: 'Teclado mecánico Nova',
    description: 'Formato 75%, switches rojos y retroiluminación blanca',
    price: new Prisma.Decimal(89.5),
    stock: 25,
  },
  {
    name: 'Mouse inalámbrico Pro',
    description: 'Sensor de alta precisión, doble conexión 2.4 GHz y Bluetooth',
    price: new Prisma.Decimal(24.99),
    stock: 50,
  },
  {
    name: 'Hub USB-C 7 en 1',
    description: 'HDMI 4K, lector de tarjetas SD y tres puertos USB-A',
    price: new Prisma.Decimal(34.99),
    stock: 80,
  },
  {
    name: 'Monitor QHD 27" 144Hz',
    description: 'Panel IPS de 27 pulgadas, ideal para trabajar y jugar',
    price: new Prisma.Decimal(259.99),
    stock: 12,
  },
  {
    name: 'Soporte de notebook de aluminio',
    description: 'Regulable en altura, compatible con notebooks de 13 a 17 pulgadas',
    price: new Prisma.Decimal(18.75),
    stock: 100,
  },
  {
    name: 'Webcam Full HD',
    description: 'Cámara 1080p con micrófono integrado y tapa de privacidad',
    price: new Prisma.Decimal(49.99),
    stock: 40,
  },
  {
    name: 'Cargador GaN 65W',
    description: 'Carga rápida USB-C para notebook, tablet y celular',
    price: new Prisma.Decimal(39.99),
    stock: 60,
  },
  {
    name: 'Auriculares ANC',
    description: 'Cancelación activa de ruido y 30 horas de batería',
    price: new Prisma.Decimal(79.9),
    stock: 35,
  },
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

  const admin = await upsertUser('camila@voltastore.com', {
    name: 'Camila Ruiz',
    passwordHash: adminHash,
    role: 'ADMIN',
  });

  const regularUser = await upsertUser('jorge@voltastore.com', {
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