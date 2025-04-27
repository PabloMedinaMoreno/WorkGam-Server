import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema } from '../src/databases/db.js';
const baseUrl = '/api/procedures';

beforeAll(async () => {
  await setupDatabaseSchema();
});

describe('AUTH: /procedures (crear, actualizar, eliminar, obtener)', () => {
  let loginCookie;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@workgam.com',
      password: '12345',
    });
    loginCookie = loginRes.headers['set-cookie'];
  });

  it('debería crear un procedimiento correctamente', async () => {
    const newProcedure = {
      name: 'Nuevo Procedimiento',
      description: 'Descripción del nuevo procedimiento',
    };

    const res = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send(newProcedure);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', newProcedure.name);
    expect(res.body).toHaveProperty('description', newProcedure.description);
  });

  it('debería retornar un error 400 si faltan campos al crear un procedimiento', async () => {
    const newProcedure = {
      name: 'Nuevo Procedimiento',
    };

    const res = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send(newProcedure);

    expect(res.statusCode).toBe(400);
  });

  it('debería retornar un error 409 si el procedimiento ya existe', async () => {
    await request(app).post(`${baseUrl}/`).set('Cookie', loginCookie).send({
      name: 'Procedimiento Existente',
      description: 'Este procedimiento ya existe',
    });

    const res = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Procedimiento Existente',
        description: 'Este procedimiento ya existe',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('Ya existe un procedimiento con este nombre');
  });

  it('debería actualizar un procedimiento correctamente', async () => {
    const procedureRes = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Procedimiento para Actualizar',
        description: 'Descripción antes de actualizar',
      });

    const procedureId = procedureRes.body.id;
    const updatedProcedure = {
      name: 'Procedimiento Actualizado',
      description: 'Descripción actualizada del procedimiento',
    };

    const res = await request(app)
      .put(`${baseUrl}/${procedureId}`)
      .set('Cookie', loginCookie)
      .send(updatedProcedure);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', procedureId);
    expect(res.body).toHaveProperty('name', updatedProcedure.name);
    expect(res.body).toHaveProperty(
      'description',
      updatedProcedure.description,
    );
  });

  it('debería retornar un error 404 al intentar actualizar un procedimiento que no existe', async () => {
    const res = await request(app)
      .put(`${baseUrl}/999999`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Procedimiento Inexistente',
        description: 'Descripción para el procedimiento inexistente',
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Procedimiento no encontrado');
  });

  it('debería eliminar un procedimiento correctamente', async () => {
    const resCreate = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Procedimiento a Eliminar',
        description: 'Este procedimiento será eliminado',
      });

    const procedureId = resCreate.body.id;
    const resDelete = await request(app)
      .delete(`${baseUrl}/${procedureId}`)
      .set('Cookie', loginCookie);

    expect(resDelete.statusCode).toBe(204);
  });

  it('debería retornar un error 404 al intentar eliminar un procedimiento que no existe', async () => {
    const res = await request(app)
      .delete(`${baseUrl}/999999`)
      .set('Cookie', loginCookie);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Procedimiento no encontrado');
  });

  it('debería obtener todos los procedimientos correctamente', async () => {
    const res = await request(app)
      .get(`${baseUrl}/`)
      .set('Cookie', loginCookie);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('AUTH: /procedures tasks', () => {
  let loginCookie;
  let procedureId;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@workgam.com',
      password: '12345',
    });
    loginCookie = loginRes.headers['set-cookie'];

    const resCreate = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Procedimiento para Tareas',
        description: 'Este procedimiento tiene tareas',
      });

    console.log('Respuesta de creación de procedimiento:', resCreate.body);
    expect(resCreate.statusCode).toBe(201);
    expect(resCreate.body).toHaveProperty('id');

    procedureId = resCreate.body.id;
  });

  it('debería crear una tarea para un procedimiento', async () => {
    const newTask = {
      name: 'Tarea 1',
      description: 'Descripción de la tarea',
      xp: 100,
      role_id: 1,
      estimated_duration_days: 2,
      difficulty: 'medium',
    };

    const res = await request(app)
      .post(`${baseUrl}/${procedureId}/tasks`)
      .set('Cookie', loginCookie)
      .send(newTask);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', newTask.name);
    expect(res.body).toHaveProperty('description', newTask.description);
  });

  it('debería retornar un error 404 si el procedimiento no existe al crear una tarea', async () => {
    const newTask = {
      name: 'Tarea 2',
      description: 'Descripción de la tarea',
      xp: 100,
      role_id: 2,
      estimated_duration_days: 2,
      difficulty: 'medium',
    };

    const res = await request(app)
      .post(`${baseUrl}/999999/tasks`)
      .set('Cookie', loginCookie)
      .send(newTask);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Procedimiento no encontrado');
  });

  it('debería obtener las tareas de un procedimiento correctamente', async () => {
    const res = await request(app)
      .get(`${baseUrl}/${procedureId}/tasks`)
      .set('Cookie', loginCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });
});
