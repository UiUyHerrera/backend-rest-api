import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createNormalUser } from './helpers';

describe('auth', () => {
  it('registers a new user', async () => {
    const email = `register-${Date.now()}@test.com`;
    const res = await request(app).post('/auth/register').send({
      name: 'New User',
      email,
      password: 'secret123',
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe('USER');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('returns 409 when the email is already in use', async () => {
    const email = `dup-${Date.now()}@test.com`;
    await request(app).post('/auth/register').send({ name: 'First', email, password: 'secret123' });

    const res = await request(app).post('/auth/register').send({ name: 'Second', email, password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email is already in use');
  });

  it('returns 400 for invalid input', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('logs in and returns a token', async () => {
    const { user } = await createNormalUser();

    const res = await request(app).post('/auth/login').send({
      email: user.email,
      password: 'testpass123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(user.email);
  });

  it('returns 401 for wrong credentials', async () => {
    const { user } = await createNormalUser();

    const res = await request(app).post('/auth/login').send({
      email: user.email,
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('requires a token for /auth/me', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user for /auth/me', async () => {
    const { user, token } = await createNormalUser();

    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });

  it('rejects an invalid token on /auth/me', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});