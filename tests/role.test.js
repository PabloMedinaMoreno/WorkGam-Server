import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema } from '../src/databases/db.js';
const baseUrl = '/api/roles';

beforeAll(async () => {
  await setupDatabaseSchema();
});

describe('AUTH: /roles (crear, actualizar, eliminar)', () => {
  let loginCookie;

  beforeAll(async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@workgam.com',
      password: '12345',
    });
    loginCookie = loginRes.headers['set-cookie'];
  });

  it('debería crear un nuevo rol', async () => {
    const newRole = {
      name: 'Nuevo Rol',
      description: 'Descripción del nuevo rol',
    };

    const res = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send(newRole);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', newRole.name);
    expect(res.body).toHaveProperty('description', newRole.description);
  });

  it('debería retornar un error 409 si el rol ya existe', async () => {
    await request(app).post(`${baseUrl}/`).set('Cookie', loginCookie).send({
      name: 'Rol Existente',
      description: 'Este rol ya existe',
    });

    const res = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Rol Existente',
        description: 'Este rol ya existe',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El rol ya existe');
  });

  it('debería actualizar un rol correctamente', async () => {
    const roleRes = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Rol para Actualizar',
        description: 'Descripción antes de actualizar',
      });

    const roleId = roleRes.body.id;
    const updatedRole = {
      name: 'Rol Actualizado',
      description: 'Descripción actualizada del rol',
    };

    const res = await request(app)
      .put(`${baseUrl}/${roleId}`)
      .set('Cookie', loginCookie)
      .send(updatedRole);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', roleId);
    expect(res.body).toHaveProperty('name', updatedRole.name);
    expect(res.body).toHaveProperty('description', updatedRole.description);
  });

  it('debería retornar un error 409 si el rol a actualizar ya existe', async () => {
    const role1 = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({ name: 'Rol 1', description: 'Descripción del rol 1' });

    await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({ name: 'Rol 2', description: 'Descripción del rol 2' });

    const res = await request(app)
      .put(`${baseUrl}/${role1.body.id}`)
      .set('Cookie', loginCookie)
      .send({ name: 'Rol 2', description: 'Descripción del rol duplicado' });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El rol ya existe');
  });

  it('debería eliminar un rol correctamente', async () => {
    const resCreate = await request(app)
      .post(`${baseUrl}/`)
      .set('Cookie', loginCookie)
      .send({
        name: 'Rol para eliminar',
        description: 'Este rol será eliminado',
      });

    expect(resCreate.statusCode).toBe(201);

    const roleId = resCreate.body.id;

    const resDelete = await request(app)
      .delete(`${baseUrl}/${roleId}`)
      .set('Cookie', loginCookie);

    expect(resDelete.statusCode).toBe(204);
  });

  it('debería retornar un error 404 al intentar eliminar un rol que no existe', async () => {
    const res = await request(app)
      .delete(`${baseUrl}/999999`)
      .set('Cookie', loginCookie);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('El rol no existe');
  });
});
