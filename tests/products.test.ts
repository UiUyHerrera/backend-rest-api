import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { createNormalUser, createAdmin, createProduct } from './helpers';

describe('products', () => {
  it('returns an empty product list on first call', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
  });

  it('creates a product as admin', async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Admin Laptop', description: 'A fast laptop', price: 1200.5, stock: 5 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Admin Laptop');
    expect(res.body.price).toBe('1200.5');
    expect(res.body.stock).toBe(5);
  });

  it('rejects product creation for a normal user', async () => {
    const { token } = await createNormalUser();

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Denied Product', price: 10, stock: 1 });

    expect(res.status).toBe(403);
  });

  it('rejects product creation without a token', async () => {
    const res = await request(app).post('/products').send({ name: 'No Token', price: 10, stock: 1 });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid product data', async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', price: -5, stock: 0 });

    expect(res.status).toBe(400);
  });

  it('searches products by name', async () => {
    await createProduct({ name: 'Blue Widget' });
    await createProduct({ name: 'Red Gadget' });

    const res = await request(app).get('/products?q=widget');

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.items.every((p: { name: string }) => p.name.toLowerCase().includes('widget'))).toBe(true);
  });

  it('filters products by price range', async () => {
    await createProduct({ name: 'Cheap Thing', price: 5, stock: 10 });
    await createProduct({ name: 'Expensive Thing', price: 500, stock: 10 });

    const res = await request(app).get('/products?minPrice=100&maxPrice=600');

    expect(res.status).toBe(200);
    expect(res.body.items.every((p: { price: string }) => Number(p.price) >= 100 && Number(p.price) <= 600)).toBe(true);
  });

  it('paginates the product list', async () => {
    for (let i = 0; i < 5; i++) {
      await createProduct({ name: `Paged Product ${i}` });
    }

    const res = await request(app).get('/products?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
  });

  it('sorts products by price ascending', async () => {
    await createProduct({ name: 'Sort Cheap', price: 5, stock: 1 });
    await createProduct({ name: 'Sort Expensive', price: 900, stock: 1 });

    const res = await request(app).get('/products?sort=price&order=asc');

    const prices = res.body.items.map((p: { price: string }) => Number(p.price));
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('updates a product as admin', async () => {
    const product = await createProduct({ name: 'Update Me', price: 20, stock: 10 });
    const { token } = await createAdmin();

    const res = await request(app)
      .patch(`/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 25, stock: 8 });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe('25');
    expect(res.body.stock).toBe(8);
  });

  it('returns 404 for a missing product', async () => {
    const res = await request(app).get('/products/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Product not found');
  });

  it('deletes a product as admin', async () => {
    const product = await createProduct({ name: 'Delete Me', price: 1, stock: 1 });
    const { token } = await createAdmin();

    const res = await request(app).delete(`/products/${product.id}`).set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    const found = await prisma.product.findUnique({ where: { id: product.id } });
    expect(found).toBeNull();
  });
});