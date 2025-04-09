import { z } from "zod";

/**
 * Schema for creating a procedure.
 * Validates the procedure name and description.
 * 
 * @typedef {Object} CreateProcedureData
 * @property {string} name - The name of the procedure.
 * @property {string} description - The description of the procedure.
 */
export const createProcedureSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre del procedimiento es requerido" }),
  description: z
    .string()
    .min(1, { message: "La descripción del procedimiento es requerida" }),
});

/**
 * Schema for updating a procedure.
 * Validates the procedure name and description.
 * 
 * @typedef {Object} UpdateProcedureData
 * @property {string} name - The name of the procedure.
 * @property {string} description - The description of the procedure.
 */
export const updateProcedureSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre del procedimiento es requerido" }),
  description: z
    .string()
    .min(1, { message: "La descripción del procedimiento es requerida" }),
});

/**
 * Schema for starting a procedure.
 * Validates the socketId for real-time notifications.
 * 
 * @typedef {Object} StartProcedureData
 * @property {string} socketId - The socket ID used for real-time notifications.
 */
export const startProcedureSchema = z.object({
  socketId: z.string().min(1, { message: "El socketId es requerido" }),
});

/**
 * Schema for canceling a started procedure.
 * Validates the socketId for real-time notifications.
 * 
 * @typedef {Object} CancelStartedProcedureData
 * @property {string} socketId - The socket ID used for real-time notifications.
 */
export const cancelStartedProcedureSchema = z.object({
  socketId: z.string().min(1, { message: "El socketId es requerido" }),
});

/**
 * Schema for creating a procedure task.
 * Validates the task's name, description, xp, role_id, estimated duration, and difficulty.
 * 
 * @typedef {Object} CreateProcedureTaskData
 * @property {string} name - The name of the task.
 * @property {string} description - The description of the task.
 * @property {number} xp - The XP value for completing the task.
 * @property {number} role_id - The role ID associated with the task.
 * @property {number} estimated_duration_days - The estimated duration in days for completing the task.
 * @property {"easy" | "medium" | "hard"} difficulty - The difficulty level of the task.
 */
export const createProcedureTaskSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "El nombre de la tarea es requerido y no puede estar vacío.",
    }),
  description: z
    .string()
    .min(1, {
      message:
        "La descripción de la tarea es obligatoria y no puede quedar vacía.",
    }),
  xp: z.preprocess(
    (val) => Number(val),
    z.number({
      invalid_type_error:
        "El XP debe ser un número válido y no puede quedar vacío.",
    })
  ),
  role_id: z.preprocess(
    (val) => Number(val),
    z.number({
      invalid_type_error:
        "El role_id debe ser un número válido y no puede quedar vacío.",
    })
  ),
  estimated_duration_days: z.preprocess(
    (val) => Number(val),
    z.number({
      invalid_type_error:
        "La duración estimada debe ser un número válido y no puede quedar vacía.",
    })
  ),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({
      message:
        "El nivel de dificultad debe ser 'easy', 'medium' o 'hard'. Por favor, ingrese uno de estos valores.",
    }),
  }),
});
