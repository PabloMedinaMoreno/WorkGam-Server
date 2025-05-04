import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema, pool } from '../src/databases/db.js';

const procUrl = '/api/procedures';
const tasksUrl = '/api/tasks';

let adminToken;
let clientToken;
let procedureId;
let startedProcedureId;
let taskId;

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

  // 2) Signup + Login Cliente
  await request(app)
    .post('/api/auth/signup')
    .send({
      username: 'cliente1',
      email: 'cliente1@example.com',
      password: 'pass123',
      gender: 'male',
      phone: '000111222',
    });
  const loginClient = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cliente1@example.com', password: 'pass123' });
  expect(loginClient.statusCode).toBe(200);
  clientToken = loginClient.body.token;

  // 3) Crear procedimiento y arrancarlo (con cliente)
  const p = await request(app)
    .post(procUrl)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Proc Tarea', description: 'Desc' });
  procedureId = p.body.id;

  const s = await request(app)
    .post(`${procUrl}/${procedureId}/start`)
    .set('Authorization', `Bearer ${clientToken}`)
    .send({ socketId: 'socket1' });
  startedProcedureId = s.body.id;
});

describe('TASKS CRUD (Admin)', () => {
  it('GET 200 /tasks lista todas', async () => {
    const res = await request(app)
      .get(tasksUrl)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET 403 /tasks/pending rol Admin no puede', async () => {
    const res = await request(app)
      .get(`${tasksUrl}/pending`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('GET 403 /tasks/completed rol Admin no puede', async () => {
    const res = await request(app)
      .get(`${tasksUrl}/completed`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('POST 201 /procedures/:id/tasks crea tarea (Admin)', async () => {
    const newTask = {
      name: 'T1',
      description: 'D',
      xp: 10,
      role_id: 1,
      estimated_duration_days: 1,
      difficulty: 'easy',
    };
    const res = await request(app)
      .post(`${procUrl}/${procedureId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newTask);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    taskId = res.body.id;
  });

  it('PUT 200 /tasks/:id actualiza tarea (Admin)', async () => {
    const upd = {
      name: 'T1mod',
      description: 'D2',
      xp: 20,
      procedure_id: procedureId,
      role_id: 1,
      estimated_duration_days: 2,
      difficulty: 'medium',
    };
    const res = await request(app)
      .put(`${tasksUrl}/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(upd);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', upd.name);
  });

  it('PUT 404 /tasks/999999 no existe', async () => {
    const res = await request(app)
      .put(`${tasksUrl}/999999`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'X',
        description: 'Y',
        xp: 0,
        procedure_id: procedureId,
        role_id: 1,
        estimated_duration_days: 1,
        difficulty: 'easy',
      });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Tarea no encontrada');
  });

  it('DELETE 204 /tasks/:id elimina tarea (Admin)', async () => {
    const res = await request(app)
      .delete(`${tasksUrl}/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(204);
  });

  it('DELETE 404 /tasks/999999 no existe', async () => {
    const res = await request(app)
      .delete(`${tasksUrl}/999999`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Tarea no encontrada');
  });
});

describe('TASKS upload & cliente flows', () => {
  it('PUT 403 /tasks/:startedProcedureId/:taskId/upload Admin no puede', async () => {
    const res = await request(app)
      .post(`${tasksUrl}/${startedProcedureId}/${taskId}/upload`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('document', Buffer.from('dummy'), 'doc.pdf');
    expect(res.statusCode).toBe(403);
  });

  it('GET 200 /procedures/started/:startedProcedureId/tasks Cliente ve sus tareas', async () => {
    const res = await request(app)
      .get(`${procUrl}/started/${startedProcedureId}/tasks`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET 200 /procedures/started/:startedProcedureId/tasks/pending Cliente ve pendientes', async () => {
    const res = await request(app)
      .get(`${procUrl}/started/${startedProcedureId}/tasks/pending`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
