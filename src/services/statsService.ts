import prisma from '../lib/prisma';

export async function getStats() {
  const [users, products, orders, pendingOrders, revenue] = await prisma.$transaction([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.aggregate({
      where: { status: 'PENDING' },
      _sum: { total: true },
    }),
  ]);

  return {
    users,
    products,
    orders,
    pendingOrders,
    revenue: revenue._sum.total?.toString() ?? '0',
  };
}