import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema } from '../src/databases/db.js';
const baseUrl = '/api/tasks';

beforeAll(async () => {
  await setupDatabaseSchema();
});

describe('AUTH: /tasks (crear, actualizar, eliminar, obtener)', () => {
  let loginCookie;
  let procedureId;
  let roleId;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@workgam.com',
      password: '12345',
    });
    loginCookie = loginRes.headers['set-cookie'];

    expect(loginRes.statusCode).toBe(200);

    const procedureRes = await request(app)
      .post('/api/procedures/')
      .set('Cookie', loginCookie)
      .send({
        name: 'Procedimiento de Ejemplo',
        description: 'Descripción del procedimiento de ejemplo',
      });

    expect(procedureRes.statusCode).toBe(201);
    expect(procedureRes.body).toHaveProperty('id');

    procedureId = procedureRes.body.id;

    const roleRes = await request(app)
      .post('/api/roles/')
      .set('Cookie', loginCookie)
      .send({
        name: 'Empleado',
        description: 'Rol de empleado',
      });

    expect(roleRes.statusCode).toBe(201);
    expect(roleRes.body).toHaveProperty('id');

    roleId = roleRes.body.id;
  });

  it('debería crear una tarea correctamente', async () => {
    const newTask = {
      name: 'Tarea Nueva',
      description: 'Descripción de la tarea nueva',
      xp: 100,
      procedure_id: procedureId,
      role_id: roleId,
      estimated_duration_days: 3,
      difficulty: 'medium',
    };

    const res = await request(app)
      .post(`/api/procedures/${procedureId}/tasks`)
      .set('Cookie', loginCookie)
      .send(newTask);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', newTask.name);
    expect(res.body).toHaveProperty('description', newTask.description);
  });

  it('debería retornar un error 400 si faltan campos al crear una tarea', async () => {
    const newTask = {
      name: 'Tarea Incompleta',
    };

    const res = await request(app)
      .post(`/api/procedures/${procedureId}/tasks`)
      .set('Cookie', loginCookie)
      .send(newTask);

    expect(res.statusCode).toBe(400);
  });

  it('debería actualizar una tarea correctamente', async () => {
    const taskRes = await request(app)
      .post(`/api/procedures/${procedureId}/tasks`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Tarea para Actualizar',
        description: 'Descripción antes de actualizar',
        xp: 100,
        procedure_id: procedureId,
        role_id: roleId,
        estimated_duration_days: 3,
        difficulty: 'hard',
      });

    expect(taskRes.statusCode).toBe(201);
    expect(taskRes.body).toHaveProperty('id');

    const taskId = taskRes.body.id;
    const updatedTask = {
      name: 'Tarea Actualizada',
      description: 'Descripción actualizada',
      xp: 200,
      procedure_id: procedureId,
      role_id: roleId,
      estimated_duration_days: 2,
      difficulty: 'easy',
    };

    const res = await request(app)
      .put(`${baseUrl}/${taskId}`)
      .set('Cookie', loginCookie)
      .send(updatedTask);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', taskId);
    expect(res.body).toHaveProperty('name', updatedTask.name);
    expect(res.body).toHaveProperty('description', updatedTask.description);
  });

  it('debería retornar un error 404 al intentar actualizar una tarea que no existe', async () => {
    const res = await request(app)
      .put(`${baseUrl}/999999`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Tarea Inexistente',
        description: 'Descripción para tarea inexistente',
        xp: 100,
        procedure_id: procedureId,
        role_id: roleId,
        estimated_duration_days: 3,
        difficulty: 'medium',
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Tarea no encontrada');
  });

  it('debería eliminar una tarea correctamente', async () => {
    const resCreate = await request(app)
      .post(`/api/procedures/${procedureId}/tasks`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Tarea a Eliminar',
        description: 'Esta tarea será eliminada',
        xp: 100,
        procedure_id: procedureId,
        role_id: roleId,
        estimated_duration_days: 3,
        difficulty: 'medium',
      });

    const taskId = resCreate.body.id;

    const resDelete = await request(app)
      .delete(`${baseUrl}/${taskId}`)
      .set('Cookie', loginCookie);

    expect(resDelete.statusCode).toBe(204);
  });

  it('debería retornar un error 404 al intentar eliminar una tarea que no existe', async () => {
    const res = await request(app)
      .delete(`${baseUrl}/999999`)
      .set('Cookie', loginCookie);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Tarea no encontrada');
  });

  it('debería obtener todas las tareas correctamente', async () => {
    const res = await request(app)
      .get(`${baseUrl}/`)
      .set('Cookie', loginCookie);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
