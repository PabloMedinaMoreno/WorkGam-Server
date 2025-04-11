import { z } from 'zod';

/**
 * Schema for user registration (signup).
 * Validates the user's username, email, password, gender, and optional phone number.
 *
 * @typedef {Object} SignupData
 * @property {string} username - The username of the user.
 * @property {string} email - The email of the user.
 * @property {string} password - The password of the user.
 * @property {string} gender - The gender of the user ('male' or 'female').
 * @property {string} [phone] - The optional phone number of the user.
 */
export const signupSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido' }),
  email: z.string().email({ message: 'El correo electrónico debe ser válido' }),
  password: z
    .string()
    .min(5, { message: 'La contraseña debe tener al menos 5 caracteres' }),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: "El género debe ser 'male' o 'female'" }),
  }),
  phone: z.string().optional(),
});

/**
 * Schema for user login.
 * Validates the user's email and password.
 *
 * @typedef {Object} LoginData
 * @property {string} email - The email of the user.
 * @property {string} password - The password of the user.
 */
export const loginSchema = z.object({
  email: z.string().email({ message: 'El correo electrónico debe ser válido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

/**
 * Schema for updating user profile.
 * Validates the user's username, email, and optional phone number.
 *
 * @typedef {Object} UpdateProfileData
 * @property {string} username - The username of the user.
 * @property {string} email - The email of the user.
 * @property {string} [phone] - The optional phone number of the user.
 */
export const updateProfileSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido' }),
  email: z.string().email({ message: 'El correo electrónico debe ser válido' }),
  phone: z.string().optional(),
});

/**
 * Schema for changing user password.
 * Validates old password, new password, and confirms if new passwords match.
 *
 * @typedef {Object} ChangePasswordData
 * @property {string} oldPassword - The old password of the user.
 * @property {string} newPassword - The new password of the user.
 * @property {string} confirmPassword - The confirmation of the new password.
 */
export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, { message: 'La contraseña actual es requerida' }),
    newPassword: z.string().min(5, {
      message: 'La nueva contraseña debe tener al menos 5 caracteres',
    }),
    confirmPassword: z
      .string()
      .min(1, { message: 'La confirmación de la contraseña es requerida' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la contraseña actual',
    path: ['newPassword'],
  });

/**
 * Schema for creating an admin.
 * Validates the admin's username, email, and password.
 *
 * @typedef {Object} CreateAdminData
 * @property {string} username - The admin's username.
 * @property {string} email - The admin's email.
 * @property {string} password - The admin's password.
 */
export const createAdminSchema = z.object({
  username: z.string().min(1, { message: 'El nombre de usuario es requerido' }),
  email: z.string().email({ message: 'El correo electrónico debe ser válido' }),
  password: z
    .string()
    .min(5, { message: 'La contraseña debe tener al menos 5 caracteres' }),
});

/**
 * Schema for a forgot password request.
 * Validates that a valid email address is provided.
 *
 * @typedef {Object} ForgotPasswordData
 * @property {string} email - The user's email address.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'A valid email is required' }),
});

/**
 * Schema for a reset password request.
 * Validates that the new password is at least 6 characters long.
 *
 * @typedef {Object} ResetPasswordData
 * @property {string} password - The new password.
 */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'The password must be at least 6 characters long' }),
});
