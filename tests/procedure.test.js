import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema, pool } from '../src/databases/db.js';

const baseUrl = '/api/procedures';
let adminToken, clientToken;
let procedureId, startedId;

afterAll(async () => {
  await pool.end();
});

beforeAll(async () => {
  await setupDatabaseSchema();


  // 1) Login Admin
  const loginAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@workgam.com', password: '12345' });
  expect(loginAdmin.statusCode).toBe(200);
  adminToken = loginAdmin.body.token;

  // 2) Crear y Login Cliente
  const signupClient = await request(app)
    .post('/api/auth/signup')
    .send({
      username: 'cliente1',
      email: 'cliente1@example.com',
      password: 'pass123',
      gender: 'male',
      phone: '000111222',
    });
  expect(signupClient.statusCode).toBe(201);

  const loginClient = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cliente1@example.com', password: 'pass123' });
  expect(loginClient.statusCode).toBe(200);
  clientToken = loginClient.body.token;
});

describe('PROCEDURES CRUD (Admin)', () => {
  it('GET 200 /procedures (vacío)', async () => {
    const res = await request(app)
      .get(baseUrl)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it('POST 201 /procedures crea nuevo', async () => {
    const res = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Proc A', description: 'Desc A' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    procedureId = res.body.id;
  });

  it('POST 400 /procedures sin descripción', async () => {
    const res = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'SinDesc' });
    expect(res.statusCode).toBe(400);
  });

  it('POST 409 /procedures duplicado', async () => {
    const res = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Proc A', description: 'Desc A' });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Ya existe un procedimiento con este nombre');
  });

  it('PUT 200 /procedures/:id actualiza correctamente', async () => {
    const res = await request(app)
      .put(`${baseUrl}/${procedureId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Proc A mod', description: 'Desc mod' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Proc A mod');
  });

  it('PUT 404 /procedures/999999 no existe', async () => {
    const res = await request(app)
      .put(`${baseUrl}/999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X', description: 'Y' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Procedimiento no encontrado');
  });

  it('GET 200 /procedures/:id/tasks (vacío)', async () => {
    const res = await request(app)
      .get(`${baseUrl}/${procedureId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks).toHaveLength(0);
  });

  it('GET 404 /procedures/999999/tasks no existe', async () => {
    const res = await request(app)
      .get(`${baseUrl}/999999/tasks`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Procedimiento no encontrado');
  });

  it('DELETE 204 /procedures/:id elimina procedimiento', async () => {
    // Creamos otro para borrar
    const c2 = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ParaDel2', description: 'D' });
    const id2 = c2.body.id;

    const res = await request(app)
      .delete(`${baseUrl}/${id2}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(204);
  });

  it('DELETE 404 /procedures/999999 no existe', async () => {
    const res = await request(app)
      .delete(`${baseUrl}/999999`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Procedimiento no encontrado');
  });
});

describe('PROCEDURES flujo inicio/cancelación (Client)', () => {
  it('POST 201 /procedures/:id/start inicia procedimiento', async () => {
    const res = await request(app)
      .post(`${baseUrl}/${procedureId}/start`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ socketId: 'test-socket' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('procedure_id', procedureId);
    startedId = res.body.id;
  });

  it('POST 409 /procedures/:id/start ya iniciado', async () => {
    const res = await request(app)
      .post(`${baseUrl}/${procedureId}/start`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ socketId: 'test' });
    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Ya ha iniciado este procedimiento');
  });

  it('GET 200 /procedures/started devuelve mis iniciados', async () => {
    const res = await request(app)
      .get(`${baseUrl}/started`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: startedId })]),
    );
  });

  it('GET 200 /procedures/started devuelve todos los iniciados', async () => {
    const res = await request(app)
      .get(`${baseUrl}/all-started`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET 200 /procedures/started/:id/tasks devuelve tareas iniciadas', async () => {
    const res = await request(app)
      .get(`${baseUrl}/started/${startedId}/tasks`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT 200 /procedures/:id/cancel cancela iniciado', async () => {
    const res = await request(app)
      .put(`${baseUrl}/${startedId}/cancel`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ socketId: 'test' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Procedimiento cancelado correctamente');
  });

  it('PUT 404 /procedures/999999/cancel no existe', async () => {
    const res = await request(app)
      .put(`${baseUrl}/999999/cancel`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ socketId: 'x' });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Procedimiento no encontrado');
  });
});
