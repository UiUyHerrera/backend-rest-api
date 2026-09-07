import { Prisma } from '@prisma/client';
import { User } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/httpError';

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export async function createOrder(userId: string, items: OrderItemInput[]) {
  return prisma.$transaction(async (tx) => {
    const productIds = items.map((item) => item.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      throw new HttpError(400, 'One or more products do not exist');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    let total = new Prisma.Decimal(0);
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        throw new HttpError(400, `Not enough stock for ${product.name}`);
      }
      total = total.plus(product.price.times(item.quantity));
    }

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return tx.order.create({
      data: {
        userId,
        total,
        items: {
          create: items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            };
          }),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });
  });
}

export async function listOrders(user: User, page: number, limit: number) {
  const where: Prisma.OrderWhereInput = user.role === 'ADMIN' ? {} : { userId: user.id };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
  };
}

export async function getOrderById(user: User, id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  if (user.role !== 'ADMIN' && order.userId !== user.id) {
    throw new HttpError(403, 'You can only access your own orders');
  }

  return order;
}

export async function cancelOrder(user: User, id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  if (user.role !== 'ADMIN' && order.userId !== user.id) {
    throw new HttpError(403, 'You can only cancel your own orders');
  }

  if (order.status === 'CANCELLED') {
    throw new HttpError(400, 'Order is already cancelled');
  }

  return prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: { include: { product: true } } },
    });
  });
}