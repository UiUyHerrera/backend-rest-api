import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createAdmin, createNormalUser, createProduct } from './helpers';

describe('stats', () => {
  it('requires a token', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).toBe(401);
  });

  it('blocks normal users', async () => {
    const { token } = await createNormalUser();
    const res = await request(app).get('/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns the store summary for an admin', async () => {
    const { token } = await createAdmin();
    const product = await createProduct({ name: 'Stats Item', price: 50, stock: 10 });

    const { token: userToken } = await createNormalUser();
    await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ productId: product.id, quantity: 1 }] });

    const res = await request(app).get('/stats').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toBeGreaterThanOrEqual(2);
    expect(res.body.products).toBeGreaterThanOrEqual(1);
    expect(res.body.orders).toBeGreaterThanOrEqual(1);
    expect(res.body.pendingOrders).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.revenue).toBe('string');
  });
});