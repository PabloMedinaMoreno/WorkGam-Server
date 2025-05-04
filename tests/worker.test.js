import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema, pool } from '../src/databases/db.js';

const baseUrl = '/api/workers';

beforeAll(async () => {
  await setupDatabaseSchema();
});

afterAll(async () => {
  await pool.end();
});

describe('AUTH: /workers (crear, listar, actualizar, eliminar)', () => {
  let token;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@workgam.com',
        password: '12345',
      });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    token = loginRes.body.token;
  });

  it('debería crear un trabajador correctamente', async () => {
    const newWorker = {
      username: 'Nuevo Trabajador',
      email: 'trabajador@example.com',
      password: 'password123',
      gender: 'male',
      phone: '1234567890',
      role_id: 1,
    };

    const res = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send(newWorker);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', newWorker.username);
    expect(res.body).toHaveProperty('email', newWorker.email);
    expect(res.body).toHaveProperty('phone', newWorker.phone);
  });

  it('debería retornar un error 409 si el email ya está registrado al crear un trabajador', async () => {
    const res = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Otro Trabajador',
        email: 'trabajador@example.com',
        password: 'password456',
        gender: 'female',
        phone: '9876543210',
        role_id: 1,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El email ya está registrado');
  });

  it('debería listar todos los trabajadores', async () => {
    // Creamos al menos un trabajador
    await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Lista Trabajador',
        email: 'lista@example.com',
        password: 'pass123',
        gender: 'male',
        phone: '111222333',
        role_id: 1,
      });

    const res = await request(app)
      .get(baseUrl)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    // Comprobamos que cada worker tiene los campos esperados
    res.body.forEach(worker => {
      expect(worker).toHaveProperty('id');
      expect(typeof worker.id).toBe('number');

      expect(worker).toHaveProperty('username');
      expect(typeof worker.username).toBe('string');

      expect(worker).toHaveProperty('email');
      expect(typeof worker.email).toBe('string');

      expect(worker).toHaveProperty('phone');
      // phone puede ser string o null

      expect(worker).toHaveProperty('profile_pic');
      // profile_pic puede ser string o null

      expect(worker).toHaveProperty('role');
      expect(typeof worker.role).toBe('string');
    });
  });

  it('debería actualizar un trabajador correctamente', async () => {
    const createRes = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Trabajador A Modificar',
        email: 'modificar@example.com',
        password: 'password123',
        gender: 'female',
        phone: '555666777',
        role_id: 1,
      });
    const workerId = createRes.body.id;

    const updatedData = {
      username: 'Trabajador Modificado',
      email: 'modificado@example.com',
      phone: '000111222',
      role_id: 1,
    };

    const res = await request(app)
      .put(`${baseUrl}/${workerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', workerId.toString());
    expect(res.body).toHaveProperty('username', updatedData.username);
    expect(res.body).toHaveProperty('email', updatedData.email);
    expect(res.body).toHaveProperty('phone', updatedData.phone);
  });

  it('debería retornar un error 409 si al actualizar el email ya está registrado', async () => {
    await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Worker Uno',
        email: 'uno@example.com',
        password: 'pass1',
        gender: 'male',
        phone: '1010101010',
        role_id: 1,
      });
    const createRes = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Worker Dos',
        email: 'dos@example.com',
        password: 'pass2',
        gender: 'female',
        phone: '2020202020',
        role_id: 1,
      });
    const workerId = createRes.body.id;

    const res = await request(app)
      .put(`${baseUrl}/${workerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Worker Dos',
        email: 'uno@example.com',
        phone: '2020202020',
        role_id: 1,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El email ya está registrado');
  });

  it('debería retornar un error 404 al actualizar un trabajador que no existe', async () => {
    const res = await request(app)
      .put(`${baseUrl}/999999`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Inexistente',
        email: 'noexiste@example.com',
        phone: '000000000',
        role_id: 1,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('El trabajador no existe');
  });

  it('debería retornar un error 404 al asignar rol inexistente al actualizar', async () => {
    const createRes = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Worker Rol Malo',
        email: 'rolmalo@example.com',
        password: 'pass123',
        gender: 'male',
        phone: '333444555',
        role_id: 1,
      });
    const workerId = createRes.body.id;

    const res = await request(app)
      .put(`${baseUrl}/${workerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Worker Rol Malo',
        email: 'rolmalo@example.com',
        phone: '333444555',
        role_id: 9999,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('El rol no existe');
  });

  it('debería eliminar un trabajador correctamente', async () => {
    const createRes = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'Worker a Borrar',
        email: 'borrar@example.com',
        password: 'pass123',
        gender: 'female',
        phone: '444555666',
        role_id: 1,
      });
    const workerId = createRes.body.id;

    const resDelete = await request(app)
      .delete(`${baseUrl}/${workerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resDelete.statusCode).toBe(204);
  });

  it('debería retornar un error 404 al eliminar un trabajador que no existe', async () => {
    const res = await request(app)
      .delete(`${baseUrl}/999999`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('El trabajador no existe');
  });
});

describe('AUTH: /workers acceso no autenticado', () => {
  it('debería retornar un error 401 si no se está autenticado al crear', async () => {
    const res = await request(app)
      .post(baseUrl)
      .send({
        username: 'SinAuth',
        email: 'sin@example.com',
        password: 'pass',
        gender: 'male',
        phone: '000000000',
        role_id: 1,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe(
      'Se requiere autenticación para acceder a este recurso',
    );
  });

  it('debería retornar un error 401 si no se está autenticado al listar', async () => {
    const res = await request(app).get(baseUrl);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe(
      'Se requiere autenticación para acceder a este recurso',
    );
  });

  it('debería retornar un error 401 si no se está autenticado al actualizar', async () => {
    const res = await request(app)
      .put(`${baseUrl}/1`)
      .send({
        username: 'NoAuthUpd',
        email: 'noauthupd@example.com',
        phone: '111111111',
        role_id: 1,
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe(
      'Se requiere autenticación para acceder a este recurso',
    );
  });

  it('debería retornar un error 401 si no se está autenticado al eliminar', async () => {
    const res = await request(app).delete(`${baseUrl}/1`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe(
      'Se requiere autenticación para acceder a este recurso',
    );
  });
});
