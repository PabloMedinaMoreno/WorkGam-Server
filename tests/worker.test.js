import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema } from '../src/databases/db.js';
const baseUrl = '/api/workers'; // Asumimos que el endpoint de trabajadores es /api/workers

beforeAll(async () => {
  await setupDatabaseSchema();
});

describe('AUTH: /workers (crear, actualizar, eliminar)', () => {
  let loginCookie;

  beforeAll(async () => {
    // Primero nos logueamos como Administrador para realizar pruebas en las rutas protegidas
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@workgam.com',
      password: '12345',
    });
    loginCookie = loginRes.headers['set-cookie']; // Obtenemos la cookie del login
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
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send(newWorker);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', newWorker.username);
    expect(res.body).toHaveProperty('email', newWorker.email);
    expect(res.body).toHaveProperty('phone', newWorker.phone);
  });

  it('debería retornar un error 409 si el email ya está registrado al crear un trabajador', async () => {
    // Creamos un trabajador existente
    await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        username: 'Trabajador Existente',
        email: 'trabajador@example.com',
        password: 'password123',
        gender: 'male',
        phone: '9876543210',
        role_id: 1,
      });

    // Intentamos crear el mismo trabajador
    const res = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        username: 'Nuevo Trabajador',
        email: 'trabajador@example.com', // Email duplicado
        password: 'password123',
        gender: 'male',
        phone: '1234567890',
        role_id: 1,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El email ya está registrado');
  });

  it('debería actualizar un trabajador correctamente', async () => {
    // Primero creamos un trabajador
    const workerRes = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        username: 'Trabajador a Actualizar',
        email: 'trabajador_actualizar@example.com',
        password: 'password123',
        gender: 'female',
        phone: '1234567890',
        role_id: 1,
      });

    const workerId = workerRes.body.id;
    const updatedWorker = {
      username: 'Trabajador Actualizado',
      email: 'trabajador_actualizado@example.com',
      phone: '0987654321',
      role_id: 1,
    };

    // Actualizamos el trabajador
    const res = await request(app)
      .put(`${baseUrl}/${workerId}`)
      .set('Cookie', loginCookie)
      .send(updatedWorker);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', workerId.toString());
    expect(res.body).toHaveProperty('username', updatedWorker.username);
    expect(res.body).toHaveProperty('email', updatedWorker.email);
    expect(res.body).toHaveProperty('phone', updatedWorker.phone);
  });

  // it("debería retornar un error 404 al intentar actualizar un trabajador que no existe", async () => {
  //   const res = await request(app)
  //     .put(`${baseUrl}/999999`) // ID inexistente
  //     .set("Cookie", loginCookie)
  //     .send({
  //       username: "Trabajador Inexistente",
  //       email: "trabajador_inexistente@example.com",
  //       phone: "0000000000",
  //     });

  //   expect(res.statusCode).toBe(404);
  //   expect(res.body.message).toBe("El trabajador no existe");
  // });

  it('debería eliminar un trabajador correctamente', async () => {
    // Creamos un trabajador para eliminar
    const resCreate = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        username: 'Trabajador a Eliminar',
        email: 'trabajador_eliminar@example.com',
        password: 'password123',
        gender: 'male',
        phone: '1234567890',
        role_id: 1,
      });

    const workerId = resCreate.body.id;

    // Eliminamos el trabajador
    const resDelete = await request(app)
      .delete(`${baseUrl}/${workerId}`)
      .set('Cookie', loginCookie);

    expect(resDelete.statusCode).toBe(204); // No content
  });

  it('debería retornar un error 404 al intentar eliminar un trabajador que no existe', async () => {
    const res = await request(app)
      .delete(`${baseUrl}/999999`) // ID inexistente
      .set('Cookie', loginCookie);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('El trabajador no existe');
  });
});

describe('AUTH: /workers acceso no autenticado', () => {
  it('debería retornar un error 401 si no se está autenticado', async () => {
    const newWorker = {
      username: 'Nuevo Trabajador',
      email: 'trabajador_no_autenticado@example.com',
      password: 'password123',
      gender: 'male',
      phone: '1234567890',
      role_id: 1,
    };

    const res = await request(app)
      .post(`${baseUrl}/`)
      .send(newWorker);

    expect(res.statusCode).toBe(401); // Sin token
    expect(res.body.message).toBe('Se requiere autenticación para acceder a este recurso');
  });
});
