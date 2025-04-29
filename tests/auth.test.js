import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema } from '../src/databases/db.js';
const baseUrl = '/api/auth';

beforeAll(async () => {
  await setupDatabaseSchema();
});

describe('AUTH: /signup', () => {
  it('debería registrar un nuevo usuario y verificar todas las propiedades', async () => {
    const res = await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).toHaveProperty('profile_pic');
    expect(res.body).toHaveProperty('phone', '123456789');
    expect(res.body).toHaveProperty('role', 'Cliente');
  });

  it('debería retornar un error 409 si el email ya está registrado', async () => {
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'user1',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });

    const res = await request(app).post(`${baseUrl}/signup`).send({
      username: 'user2',
      email: 'test@example.com',
      password: '654321',
      gender: 'female',
      phone: '987654321',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toBe('El email ya está registrado');
  });
});

describe('AUTH: /login', () => {
  it('debería autenticar a un usuario con credenciales válidas y devolver todos los campos', async () => {
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });

    const res = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '123456',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).toHaveProperty('role');
    expect(res.body).toHaveProperty('profile_pic');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('debería retornar un error 404 si el usuario no existe', async () => {
    const res = await request(app).post(`${baseUrl}/login`).send({
      email: 'nonexistent@example.com',
      password: '123456',
    });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('El usuario no existe');
  });

  it('debería retornar un error 401 si la contraseña es incorrecta', async () => {
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });

    const res = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Contraseña inválida');
  });
});

describe('AUTH: /logout', () => {
  it('debería cerrar sesión correctamente y limpiar las cookies', async () => {
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '123456',
    });

    const res = await request(app)
      .post(`${baseUrl}/logout`)
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Sesión cerrada exitosamente');
  });
});

describe('AUTH: /profile', () => {
  it('debería retornar el perfil completo del usuario autenticado', async () => {
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '123456',
    });

    const res = await request(app)
      .get(`${baseUrl}/profile`)
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).toHaveProperty('phone', '123456789');
    expect(res.body).toHaveProperty('profile_pic');
  });
});

describe('AUTH: /changePassword', () => {
  it('debería cambiar la contraseña correctamente y verificar el mensaje de éxito', async () => {
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '123456',
    });

    const res = await request(app)
      .put(`${baseUrl}/changePassword`)
      .set('Cookie', loginRes.headers['set-cookie'])
      .send({
        oldPassword: '123456',
        newPassword: '654321',
        confirmPassword: '654321',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Contraseña cambiada exitosamente');
  });

  it('debería retornar un error 401 si la contraseña actual es incorrecta', async () => {
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '654321',
    });

    const res = await request(app)
      .put(`${baseUrl}/changePassword`)
      .set('Cookie', loginRes.headers['set-cookie'])
      .send({
        oldPassword: 'wrongpassword',
        newPassword: '123456',
        confirmPassword: '123456',
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Contraseña actual incorrecta');
  });

  it('debería retornar un error 400 si las contraseñas no coinciden', async () => {
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '654321',
    });

    const res = await request(app)
      .put(`${baseUrl}/changePassword`)
      .set('Cookie', loginRes.headers['set-cookie'])
      .send({
        oldPassword: '654321',
        newPassword: '123456',
        confirmPassword: 'wrongpassword',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Las contraseñas no coinciden');
  });
});

describe('AUTH: /forgot-password', () => {
  it('debería enviar un correo para restablecer la contraseña y verificar el token', async () => {
    const res = await request(app).post(`${baseUrl}/forgot-password`).send({
      email: 'test@example.com',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      'El enlace para restablecer tu contraseña ha sido enviado',
    );
    expect(res.body).toHaveProperty('token');
  });

  it('debería retornar un error 400 si el email no existe', async () => {
    const res = await request(app).post(`${baseUrl}/forgot-password`).send({
      email: 'nonexistent@example.com',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('El email no está registrado');
  });
});

describe('AUTH: /reset-password', () => {
  it('debería restablecer la contraseña correctamente', async () => {
    const resForgotPassword = await request(app)
      .post(`${baseUrl}/forgot-password`)
      .send({
        email: 'test@example.com',
      });

    const resetToken = resForgotPassword.body.token;

    const res = await request(app)
      .post(`${baseUrl}/reset-password/${resetToken}`)
      .send({
        password: 'newpassword123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe(
      'La contraseña ha sido actualizada exitosamente',
    );
  });

  it('debería retornar un error 400 si el token es inválido', async () => {
    const res = await request(app)
      .post(`${baseUrl}/reset-password/invalidtoken`)
      .send({
        password: 'newpassword123',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Token inválido o expirado');
  });
});
