import { z } from "zod";

/**
 * Schema for creating a role.
 * Validates the role's name and description.
 *
 * @typedef {Object} CreateRoleData
 * @property {string} name - The role's name.
 * @property {string} description - The role's description.
 */
export const createRoleSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  description: z.string().min(1, { message: "La descripción es requerida" }),
});

/**
 * Schema for updating a role.
 * Validates the role's name and description.
 *
 * @typedef {Object} UpdateRoleData
 * @property {string} name - The role's name.
 * @property {string} description - The role's description.
 */
export const updateRoleSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  description: z.string().min(1, { message: "La descripción es requerida" }),
});
