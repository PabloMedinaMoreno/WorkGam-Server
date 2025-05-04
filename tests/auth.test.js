import request from 'supertest';
import app from '../src/app.js';
import { setupDatabaseSchema, pool } from '../src/databases/db.js';

const baseUrl = '/api/auth';

beforeAll(async () => {
  await setupDatabaseSchema();
});

afterAll(async () => {
  await pool.end();
});

describe('AUTH: /signup', () => {
  it('debería registrar un nuevo usuario y verificar todas las propiedades', async () => {
    const res = await request(app)
      .post(`${baseUrl}/signup`)
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: '123456',
        gender: 'male',
        phone: '123456789',
      });

    expect(res.statusCode).toBe(201);

    // ahora vienen en res.body.user y res.body.token
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');

    const { user } = res.body;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('email', 'test@example.com');
    expect(user).toHaveProperty('profile_pic');
    expect(user).toHaveProperty('phone', '123456789');
    expect(user).toHaveProperty('role', 'Cliente');
  });

  it('debería retornar un error 409 si el email ya está registrado', async () => {
    // primer signup
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'user1',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });

    // intento duplicado
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
    // creamos usuario
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });

    // login
    const res = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '123456',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');

    const { user, token } = res.body;
    expect(typeof token).toBe('string');
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('username', 'testuser');
    expect(user).toHaveProperty('email', 'test@example.com');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('profile_pic');
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
    // creamos usuario
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

describe('AUTH: /profile', () => {
  it('debería retornar el perfil completo del usuario autenticado', async () => {
    // signup + login
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '123456',
    });

    const { token } = loginRes.body;
    const res = await request(app)
      .get(`${baseUrl}/profile`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).toHaveProperty('phone', '123456789');
    expect(res.body).toHaveProperty('profile_pic');
  });
});

describe('AUTH: /profile [PUT]', () => {
  it('debería actualizar el perfil correctamente y devolver los datos actualizados', async () => {
    // Creamos y login de usuario original
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'originalUser',
      email: 'original@example.com',
      password: '123456',
      gender: 'male',
      phone: '111222333',
    });
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'original@example.com',
      password: '123456',
    });
    const { token } = loginRes.body;

    // Petición de actualización
    const res = await request(app)
      .put(`${baseUrl}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'updatedUser',
        email: 'updated@example.com',
        phone: '999888777',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', 'updatedUser');
    expect(res.body).toHaveProperty('email', 'updated@example.com');
    expect(res.body).toHaveProperty('phone', '999888777');
    expect(res.body).toHaveProperty('profile_pic');
  });

  it('debería retornar un error 409 si el email ya está registrado por otro usuario', async () => {
    // Creamos dos usuarios
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'userA',
      email: 'a@example.com',
      password: '123456',
      gender: 'male',
      phone: '000111222',
    });
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'userB',
      email: 'b@example.com',
      password: '654321',
      gender: 'female',
      phone: '333444555',
    });

    // Login con el usuario A
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'a@example.com',
      password: '123456',
    });
    const { token } = loginRes.body;

    // Intentamos actualizar A usando el email de B
    const res = await request(app)
      .put(`${baseUrl}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'userA_new',
        email: 'b@example.com',
        phone: '000111222',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message', 'El email ya está registrado');
  });
});


describe('AUTH: /changePassword', () => {
  it('debería cambiar la contraseña correctamente y verificar el mensaje de éxito', async () => {
    // signup + login
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      gender: 'male',
      phone: '123456789',
    });
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '123456',
    });

    const { token } = loginRes.body;
    const res = await request(app)
      .put(`${baseUrl}/changePassword`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        oldPassword: '123456',
        newPassword: '654321',
        confirmPassword: '654321',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Contraseña cambiada exitosamente');
  });

  it('debería retornar un error 401 si la contraseña actual es incorrecta', async () => {
    // signup + login con contraseña distinta
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '654321',
      gender: 'male',
      phone: '123456789',
    });
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '654321',
    });

    const { token } = loginRes.body;
    const res = await request(app)
      .put(`${baseUrl}/changePassword`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        oldPassword: 'wrongpassword',
        newPassword: '123456',
        confirmPassword: '123456',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Contraseña actual incorrecta');
  });

  it('debería retornar un error 400 si las contraseñas no coinciden', async () => {
    // signup + login
    await request(app).post(`${baseUrl}/signup`).send({
      username: 'testuser',
      email: 'test@example.com',
      password: '654321',
      gender: 'male',
      phone: '123456789',
    });
    const loginRes = await request(app).post(`${baseUrl}/login`).send({
      email: 'test@example.com',
      password: '654321',
    });

    const { token } = loginRes.body;
    const res = await request(app)
      .put(`${baseUrl}/changePassword`)
      .set('Authorization', `Bearer ${token}`)
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

    const { token: resetToken } = resForgotPassword.body;

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
