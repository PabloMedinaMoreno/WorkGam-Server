import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema, pool } from '../src/databases/db.js';
const baseUrl = '/api/roles';

beforeAll(async () => {
  await setupDatabaseSchema();
});

afterAll(async () => {
  await pool.end();
});

describe('AUTH: /roles (crear, listar, actualizar, eliminar)', () => {
  let token;

  beforeAll(async () => {
    // Hacemos login y guardamos el token
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

  it('debería crear un nuevo rol', async () => {
    const newRole = {
      name: 'Nuevo Rol',
      description: 'Descripción del nuevo rol',
    };

    const res = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send(newRole);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', newRole.name);
    expect(res.body).toHaveProperty('description', newRole.description);
  });

  it('debería listar todos los roles', async () => {
    // Crear un par de roles para poblar
    await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Rol Existente', description: 'Este rol ya existe' });

    const res = await request(app)
      .get(baseUrl)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Al menos contendrá el rol que acabamos de crear
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          name: 'Rol Existente',
          description: 'Este rol ya existe',
        }),
      ]),
    );
  });

  it('debería retornar un error 409 si el rol ya existe', async () => {
    const payload = {
      name: 'Rol Existente',
      description: 'Este rol ya existe',
    };
    // Primer intento
    await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    // Segundo intento duplicado
    const res = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El rol ya existe');
  });

  it('debería actualizar un rol correctamente', async () => {
    // Creamos un rol para actualizar
    const createRes = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Rol para Actualizar',
        description: 'Descripción antes de actualizar',
      });
    const roleId = createRes.body.id;

    const updatedRole = {
      name: 'Rol Actualizado',
      description: 'Descripción actualizada del rol',
    };

    const res = await request(app)
      .put(`${baseUrl}/${roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedRole);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', roleId);
    expect(res.body).toHaveProperty('name', updatedRole.name);
    expect(res.body).toHaveProperty('description', updatedRole.description);
  });

  it('debería retornar un error 409 si el rol a actualizar ya existe', async () => {
    // Creamos dos roles distintos
    const role1 = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Rol 1', description: 'Descripción del rol 1' });

    await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Rol 2', description: 'Descripción del rol 2' });

    // Intentamos renombrar Rol 1 como "Rol 2"
    const res = await request(app)
      .put(`${baseUrl}/${role1.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Rol 2', description: 'Duplicado' });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El rol ya existe');
  });

  it('debería eliminar un rol correctamente', async () => {
    // Creamos un rol para eliminar
    const createRes = await request(app)
      .post(baseUrl)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Rol para eliminar',
        description: 'Este rol será eliminado',
      });
    const roleId = createRes.body.id;

    const resDelete = await request(app)
      .delete(`${baseUrl}/${roleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(resDelete.statusCode).toBe(204);
  });

  it('debería retornar un error 404 al intentar eliminar un rol que no existe', async () => {
    const res = await request(app)
      .delete(`${baseUrl}/999999`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('El rol no existe');
  });
});
