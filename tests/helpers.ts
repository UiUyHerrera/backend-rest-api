import request from 'supertest';
import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import prisma from '../src/lib/prisma';
import app from '../src/app';

export async function createUser(overrides: { name?: string; email?: string; password?: string; role?: 'USER' | 'ADMIN' } = {}) {
  const password = overrides.password || 'testpass123';
  const passwordHash = await bcrypt.hash(password, 4);
  return prisma.user.create({
    data: {
      name: overrides.name || 'Test User',
      email: overrides.email || `user-${Date.now()}-${Math.random()}@test.com`,
      passwordHash,
      role: overrides.role || 'USER',
    },
  });
}

export async function getToken(user: User) {
  const login = await request(app).post('/auth/login').send({
    email: user.email,
    password: 'testpass123',
  });
  return login.body.token as string;
}

export async function createAdmin() {
  const admin = await createUser({ name: 'Admin User', role: 'ADMIN' });
  const token = await getToken(admin);
  return { admin, token };
}

export async function createNormalUser() {
  const user = await createUser({ name: 'Regular User' });
  const token = await getToken(user);
  return { user, token };
}

export async function createProduct(overrides: { name?: string; price?: number; stock?: number } = {}) {
  const { token } = await createAdmin();
  const res = await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides.name || `Product ${Date.now()}`,
      description: 'A test product',
      price: overrides.price ?? 10,
      stock: overrides.stock ?? 20,
    });
  return res.body;
}