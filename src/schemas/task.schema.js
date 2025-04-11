import { z } from 'zod';

/**
 * Schema for accepting a task.
 * Used in the acceptTask function to validate the socketId.
 *
 * @typedef {Object} AcceptTaskData
 * @property {string} socketId - The socket ID of the client for real-time notifications.
 */
export const acceptTaskSchema = z.object({
  socketId: z.string().min(1, { message: 'El socketId es obligatorio' }),
});

/**
 * Schema for rejecting a task.
 * Used in the rejectTask function to validate the reason for rejection and socketId.
 *
 * @typedef {Object} RejectTaskData
 * @property {string} reason - The reason for rejecting the task.
 * @property {string} socketId - The socket ID of the client for real-time notifications.
 */
export const rejectTaskSchema = z.object({
  reason: z
    .string()
    .min(1, { message: 'El motivo del rechazo es obligatorio.' }),
  socketId: z.string().min(1, { message: 'El socketId es obligatorio.' }),
});

/**
 * Schema for updating a task.
 * Used in the updateTask function to validate the task's name, description, XP, procedure ID, role ID, estimated duration, and difficulty.
 *
 * @typedef {Object} UpdateTaskData
 * @property {string} name - The name of the task.
 * @property {string} description - The description of the task.
 * @property {number} xp - The XP value for completing the task.
 * @property {number} procedure_id - The ID of the procedure associated with the task.
 * @property {number} role_id - The ID of the role associated with the task.
 * @property {number} estimated_duration_days - The estimated duration in days to complete the task.
 * @property {"easy" | "medium" | "hard"} difficulty - The difficulty level of the task.
 */
export const updateTaskSchema = z.object({
  name: z.string().min(1, { message: 'El nombre de la tarea es obligatorio.' }),
  description: z
    .string()
    .min(1, { message: 'La descripción de la tarea es obligatoria.' }),
  xp: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: 'El XP debe ser un número válido.' }),
  ),
  procedure_id: z.preprocess(
    (val) => Number(val),
    z.number({
      invalid_type_error: 'El ID del procedimiento debe ser un número válido.',
    }),
  ),
  role_id: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: 'El role_id debe ser un número válido.' }),
  ),
  estimated_duration_days: z.preprocess(
    (val) => Number(val),
    z.number({
      invalid_type_error: 'La duración estimada debe ser un número válido.',
    }),
  ),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({
      message: "El nivel de dificultad debe ser 'easy', 'medium' o 'hard'.",
    }),
  }),
});
