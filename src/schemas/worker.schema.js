import { z } from "zod";

/**
 * Schema for creating a worker.
 * Validates the worker's username, email, password, gender, role_id, and optional phone.
 *
 * @typedef {Object} CreateWorkerData
 * @property {string} username - The worker's username.
 * @property {string} email - The worker's email.
 * @property {string} password - The worker's password.
 * @property {string} gender - The worker's gender ('male' or 'female').
 * @property {number} role_id - The worker's role ID.
 * @property {string} [phone] - The optional phone number of the worker.
 */
export const createWorkerSchema = z.object({
  username: z.string().min(1, { message: "El nombre de usuario es requerido" }),
  email: z.string().email({ message: "El correo electrónico debe ser válido" }),
  password: z
    .string()
    .min(5, { message: "La contraseña debe tener al menos 5 caracteres" }),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "El género debe ser 'male' o 'female'" }),
  }),
  role_id: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "El role_id debe ser un número" })
  ),
  phone: z.string().optional(),
});

/**
 * Schema for updating a worker's details.
 * Validates the worker's username, email, role_id, and optional phone.
 *
 * @typedef {Object} UpdateWorkerData
 * @property {string} username - The worker's username.
 * @property {string} email - The worker's email.
 * @property {number} role_id - The worker's role ID.
 * @property {string} [phone] - The optional phone number of the worker.
 */
export const updateWorkerSchema = z.object({
  username: z.string().min(1, { message: "El nombre de usuario es requerido" }),
  email: z.string().email({ message: "El correo electrónico debe ser válido" }),
  role_id: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "El role_id debe ser un número" })
  ),
  phone: z.string().optional(),
});
