import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/httpError';

export interface ProductListQuery {
  q?: string;
  page: number;
  limit: number;
  minPrice?: number;
  maxPrice?: number;
  sort: 'name' | 'price' | 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
}

export async function listProducts(query: ProductListQuery) {
  const where: Prisma.ProductWhereInput = {};

  if (query.q) {
    where.name = { contains: query.q, mode: 'insensitive' };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) {
      where.price.gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      where.price.lte = query.maxPrice;
    }
  }

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new HttpError(404, 'Product not found');
  }
  return product;
}

export async function createProduct(data: { name: string; description?: string; price: number; stock: number }) {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: new Prisma.Decimal(data.price),
      stock: data.stock,
    },
  });
}

export async function updateProduct(
  id: string,
  data: { name?: string; description?: string; price?: number; stock?: number }
) {
  await getProductById(id);

  const updateData: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
  if (data.stock !== undefined) updateData.stock = data.stock;

  return prisma.product.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteProduct(id: string) {
  await getProductById(id);
  await prisma.product.delete({ where: { id } });
}