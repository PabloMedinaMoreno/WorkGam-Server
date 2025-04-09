import {
  createRoleService,
  getRolesService,
  updateRoleService,
  deleteRoleService,
} from "../services/role.service.js";

/**
 * Creates a new role.
 *
 * Responds with:
 *   - 201 Created: If the role is created successfully.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    const role = await createRoleService({ name, description });
    res.status(201).json(role);
  } catch (error) {
    if (error.message.includes("ya existe")) {
      res.status(409).json({ message: error.message });
    }
    else {
      console.error("Error creating role:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

/**
 * Retrieves all roles.
 *
 * Responds with:
 *   - 200 OK: If the roles are retrieved successfully.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await getRolesService();
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error getting roles:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Updates an existing role.
 *
 * Responds with:
 *   - 200 OK: If the role is updated successfully.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, description } = req.body;
    const role = await updateRoleService(roleId, { name, description });
    res.status(200).json(role);
  } catch (error) {
    if (error.message.includes("ya existe")) {
      res.status(409).json({ message: error.message });
    }
    else {
      console.error("Error updating role:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

/**
 * Deletes a role.
 *
 * Responds with:
 *   - 204 No Content: If the role is deleted successfully.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    await deleteRoleService(roleId);
    res.status(204).json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: error.message });
  }
};
