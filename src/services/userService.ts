import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { HttpError } from '../lib/httpError';

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user;
}

export async function updateUser(id: string, data: { name?: string; email?: string; password?: string }) {
  const updateData: { name?: string; email?: string; passwordHash?: string } = {};

  if (data.name) {
    updateData.name = data.name;
  }

  if (data.email) {
    const normalizedEmail = data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== id) {
      throw new HttpError(409, 'Email is already in use');
    }
    updateData.email = normalizedEmail;
  }

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return user;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
}