import prisma from '../lib/prisma';

export async function getStats() {
  const [users, products, orders, pendingOrders] = await prisma.$transaction([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
  ]);

  return { users, products, orders, pendingOrders };
}