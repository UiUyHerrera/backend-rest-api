import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';
import { createNormalUser, createProduct } from './helpers';

describe('orders', () => {
  it('creates an order, computes the total and reduces stock', async () => {
    const { token } = await createNormalUser();
    const productA = await createProduct({ name: 'Order Item A', price: 10, stock: 20 });
    const productB = await createProduct({ name: 'Order Item B', price: 5.5, stock: 20 });

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { productId: productA.id, quantity: 2 },
          { productId: productB.id, quantity: 4 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe('42');
    expect(res.body.status).toBe('PENDING');
    expect(res.body.items).toHaveLength(2);

    const updatedA = await prisma.product.findUnique({ where: { id: productA.id } });
    const updatedB = await prisma.product.findUnique({ where: { id: productB.id } });
    expect(updatedA!.stock).toBe(18);
    expect(updatedB!.stock).toBe(16);
  });

  it('rejects an order with insufficient stock', async () => {
    const { token } = await createNormalUser();
    const product = await createProduct({ name: 'Low Stock Item', price: 10, stock: 2 });

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: product.id, quantity: 5 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Not enough stock');
  });

  it('rejects an order without a token', async () => {
    const product = await createProduct({ name: 'Auth Item', price: 10, stock: 2 });

    const res = await request(app)
      .post('/orders')
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    expect(res.status).toBe(401);
  });

  it('rejects an order with a product that does not exist', async () => {
    const { token } = await createNormalUser();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('One or more products do not exist');
  });

  it('returns 400 for an empty order', async () => {
    const { token } = await createNormalUser();

    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] });

    expect(res.status).toBe(400);
  });

  it('lets a normal user see only their own orders', async () => {
    const { token } = await createNormalUser();
    const other = await createNormalUser();
    const product = await createProduct({ name: 'Visibility Item', price: 10, stock: 30 });

    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    const res = await request(app).get('/orders').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.items).toHaveLength(0);
  });

  it('blocks access to another users order', async () => {
    const { token } = await createNormalUser();
    const owner = await createNormalUser();
    const product = await createProduct({ name: 'Ownership Item', price: 10, stock: 30 });

    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    const res = await request(app)
      .get(`/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('cancels an order and restores stock', async () => {
    const { token } = await createNormalUser();
    const product = await createProduct({ name: 'Cancel Item', price: 7, stock: 10 });

    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: product.id, quantity: 3 }] });

    const res = await request(app)
      .patch(`/orders/${created.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated!.stock).toBe(10);
  });

  it('rejects cancelling an already cancelled order', async () => {
    const { token } = await createNormalUser();
    const product = await createProduct({ name: 'Double Cancel Item', price: 7, stock: 10 });

    const created = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    await request(app).patch(`/orders/${created.body.id}/cancel`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/orders/${created.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Order is already cancelled');
  });
});