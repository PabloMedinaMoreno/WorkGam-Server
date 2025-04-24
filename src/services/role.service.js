import { pool } from '../databases/db.js';

/**
 * Creates a new role in the system.
 *
 * @param {Object} roleData - The role data to be created.
 * @param {string} roleData.name - The name of the role.
 * @param {string} roleData.description - The description of the role.
 * @returns {Promise<Object>} The created role data.
 * @throws {Error} Throws an error if the role cannot be created.
 */
export const createRoleService = async ({ name, description }) => {
  try {
    // Check if the role already exists
    const roleCheck = await pool.query('SELECT * FROM role WHERE name = $1', [
      name,
    ]);
    if (roleCheck.rowCount > 0) {
      throw new Error('El rol ya existe');
    }

    const result = await pool.query(
      'INSERT INTO role (name, description) VALUES ($1, $2) RETURNING *',
      [name, description],
    );

    // Check if the role was created successfully
    if (result.rowCount === 0) {
      throw new Error('Error al crear el rol');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(error.message || 'Error al crear el rol');
  }
};

/**
 * Retrieves all roles in the system.
 *
 * @returns {Promise<Array>} An array of all roles.
 * @throws {Error} Throws an error if roles cannot be retrieved.
 */
export const getRolesService = async () => {
  try {
    const result = await pool.query('SELECT * FROM role');
    return result.rows;
  } catch (error) {
    throw new Error(error.message || 'Error al obtener los roles');
  }
};

/**
 * Retrieves the names of all employee roles.
 *
 * @returns {Promise<Array>} An array of role names.
 * @throws {Error} Throws an error if employee roles cannot be retrieved.
 */
export const getEmployeeRolesService = async () => {
  try {
    const result = await pool.query('SELECT * FROM role');
    const rolesNames = result.rows.map((role) => role.name);
    return rolesNames;
  } catch (error) {
    throw new Error(error.message || 'Error al obtener los roles de empleados');
  }
};

/**
 * Updates a role in the system.
 *
 * @param {number} roleId - The role ID to update.
 * @param {Object} roleData - The role data to update.
 * @param {string} roleData.name - The new name of the role.
 * @param {string} roleData.description - The new description of the role.
 * @returns {Promise<Object>} The updated role data.
 * @throws {Error} Throws an error if the role cannot be updated.
 */
export const updateRoleService = async (roleId, { name, description }) => {
  try {
    // Check if the role exists
    const roleCheck = await pool.query('SELECT * FROM role WHERE id = $1', [
      roleId,
    ]);
    if (roleCheck.rowCount === 0) {
      throw new Error('El rol no existe');
    }

    // Check if the new role name already exists
    const roleNameCheck = await pool.query(
      'SELECT * FROM role WHERE name = $1 AND id != $2',
      [name, roleId],
    );
    if (roleNameCheck.rowCount > 0) {
      throw new Error('El rol ya existe');
    }


    // Update the role
    const result = await pool.query(
      'UPDATE role SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, roleId],
    );

    // Check if the role was updated successfully
    if (result.rowCount === 0) {
      throw new Error('Error al actualizar el rol');
    }
    // Return the updated role
    return result.rows[0];
  } catch (error) {
    throw new Error(error.message || 'Error al actualizar el rol');
  }
};

/**
 * Deletes a role from the system.
 *
 * @param {number} roleId - The role ID to delete.
 * @returns {Promise<void>} Resolves with no return value when the role is deleted.
 * @throws {Error} Throws an error if the role cannot be deleted.
 */
export const deleteRoleService = async (roleId) => {
  try {
    // Check if the role exists
    const roleCheck = await pool.query('SELECT * FROM role WHERE id = $1', [
      roleId,
    ]);
    if (roleCheck.rowCount === 0) {
      throw new Error('El rol no existe');
    }
    await pool.query('DELETE FROM role WHERE id = $1', [roleId]);
  } catch (error) {
    throw new Error(error.message || 'Error al eliminar el rol');
  }
};
