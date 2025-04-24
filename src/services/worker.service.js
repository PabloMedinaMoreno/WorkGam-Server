import { pool } from '../databases/db.js';
import { createAndSendNotificationService } from './notification.service.js';
import bcrypt from 'bcryptjs';

/**
 * Creates a new worker in the system.
 * @param {Object} workerData - The data for the worker to be created.
 * @returns {Promise<Object>} The created worker's data.
 */
export const createWorkerService = async ({
  username,
  email,
  password,
  gender,
  phone,
  role_id,
}) => {
  // Encrypt the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Define the profile picture based on gender
  const profilePic =
    gender === 'male'
      ? `https://avatar.iran.liara.run/public/boy?username=${username}`
      : `https://avatar.iran.liara.run/public/girl?username=${username}`;

  try {
    // Check if the email already exists
    const emailCheck = await pool.query(
      'SELECT * FROM person WHERE email = $1',
      [email],
    );
    if (emailCheck.rowCount > 0) {
      throw new Error('El email ya está registrado');
    }

    // Insert the worker in the person table
    const personResult = await pool.query(
      'INSERT INTO person (username, email, password, profile_pic, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, hashedPassword, profilePic, phone || null],
    );
    const personId = personResult.rows[0].id;

    // Insert the worker in the employee table
    await pool.query(
      'INSERT INTO employee (id, role_id) VALUES ($1, $2) RETURNING *',
      [personId, role_id],
    );

    // Insert the worker in the gamification table
    await pool.query('INSERT INTO gamification (employee_id) VALUES ($1)', [
      personId,
    ]);

    // Create a welcome notification
    await createAndSendNotificationService(
      personId,
      '¡Bienvenido a la plataforma!',
    );

    return {
      id: personId,
      username,
      email,
      role: role_id, // Assuming role_id is passed
      profile_pic: profilePic,
      phone,
    };
  } catch (error) {
    console.error('Error registering worker:', error);
    throw new Error(error.message || 'Error registrando el trabajador');
  }
};

/**
 * Retrieves all workers from the system.
 * @returns {Promise<Array>} An array of all workers.
 */
export const getWorkersService = async () => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.username, p.email, p.profile_pic, p.phone, r.name AS role
       FROM person p JOIN employee e ON p.id = e.id JOIN role r ON e.role_id = r.id`,
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting workers:', error);
    throw new Error('Error getting workers');
  }
};

/**
 * Updates a worker's information in the system.
 * @param {number} workerId - The worker's ID to update.
 * @param {Object} workerData - The data to update.
 * @returns {Promise<Object>} The updated worker's data.
 */
export const updateWorkerService = async (
  workerId,
  { username, email, role_id, phone },
) => {
  try {

    const existingWorker = await pool.query(
      'SELECT * FROM person WHERE id = $1',
      [workerId],
    );

    // Check if the worker exists
    if (existingWorker.rowCount === 0) {
      throw new Error('El trabajador no existe');
    }
    // Check if the email already exists for another worker
    const emailCheck = await pool.query(
      'SELECT * FROM person WHERE email = $1 AND id != $2',
      [email, workerId],
    );

    if (emailCheck.rowCount > 0) {
      throw new Error('El email ya está registrado');
    }
    // Check if the role exists
    const roleCheck = await pool.query(
      'SELECT * FROM role WHERE id = $1',
      [role_id],
    );
    if (roleCheck.rowCount === 0) {
      throw new Error('El rol no existe');
    }

    // Update the worker's personal information
    const updatedPerson = await pool.query(
      'UPDATE person SET username = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [username, email, phone || null, workerId],
    );

    // Update the worker's role
    await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [
      role_id,
      workerId,
    ]);

    // Get the updated worker's information with the role
    const role = await pool.query('SELECT name FROM role WHERE id = $1', [
      role_id,
    ]);

    return {
      id: workerId,
      username: updatedPerson.rows[0].username,
      email: updatedPerson.rows[0].email,
      role: role.rows[0].name,
      profile_pic: updatedPerson.rows[0].profile_pic,
      phone: updatedPerson.rows[0].phone || 'N/A',
    };
  } catch (error) {
    console.error('Error updating worker:', error);
    throw new Error(error.message || 'Error updating worker');
  }
};

/**
 * Deletes a worker from the system.
 * @param {number} workerId - The worker's ID to delete.
 * @returns {Promise<void>} Resolves with no return value when the worker is deleted.
 */
export const deleteWorkerService = async (workerId) => {
  try {
    // Check if the worker exists
    const existingWorker = await pool.query(
      'SELECT * FROM person WHERE id = $1',
      [workerId],
    );
    if (existingWorker.rowCount === 0) {
      throw new Error('El trabajador no existe');
    }

    // Delete the worker from the gamification table
    await pool.query('DELETE FROM gamification WHERE employee_id = $1', [
      workerId,
    ]);
    // Delete the worker from the employee table
    await pool.query('DELETE FROM employee WHERE id = $1', [workerId]);

    // Delete the worker from the person table
    await pool.query('DELETE FROM person WHERE id = $1', [workerId]);
  } catch (error) {
    console.error('Error deleting worker:', error);
    throw new Error(error.message || 'Error deleting worker');
  }
};

/**
 * This function selects an employee by role
 * @param {Number} role_id - ID of the employee's role
 * @returns {Number} employee_id - ID of the selected employee
 */
export const selectEmployeeByRoleService = async (role_id) => {
  try {
    // We get the employee with the least experience
    const employee = await pool.query(
      'SELECT * FROM gamification G JOIN employee E ON G.employee_id = E.id WHERE E.role_id = $1 ORDER BY G.xp_total ASC LIMIT 1',
      [role_id],
    );
    // If there are no rows we throw an error
    if (employee.rowCount === 0) {
      throw new Error('No hay empleados con ese rol.');
    }
    const employee_id = employee.rows[0].employee_id;
    return employee_id;
  } catch (error) {
    console.error('Error obteniendo empleados por experiencia:', error);
    throw new Error(error.message);
  }
};
