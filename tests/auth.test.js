import request from 'supertest';
import app from '../src/app.js';
import { pool, setupDatabaseSchema, checkDBConnection } from '../src/databases/db.js';
const baseUrl = '/api/auth';

beforeAll(async () => {
  await checkDBConnection();
  await setupDatabaseSchema();
});

afterAll(async () => {
  await pool.end();
});

describe('AUTH: /signup', () => {
  it('debería registrar un nuevo usuario', async () => {
    const res = await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
