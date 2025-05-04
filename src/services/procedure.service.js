import { pool } from '../databases/db.js';

/**
 * Retrieves all procedures.
 *
 * @returns {Promise<Array>} - Array of all procedures
 * @throws {Error} - Throws an error if an error occurs during the query
 */
export const getProceduresService = async () => {
  try {
    const procedures = await pool.query(
      'SELECT * FROM procedure ORDER BY name ASC',
    );
    return procedures.rows;
  } catch (error) {
    console.error('Error al obtener los procedimientos:', error);
    throw new Error('Error al obtener los procedimientos');
  }
};

/**
 * Retrieves the tasks for a specific procedure.
 *
 * @param {number} procedureId - ID of the procedure
 * @param {string} procedureName - Name of the procedure
 * @returns {Promise<Object>} - Object containing the procedure and its tasks
 * @throws {Error} - Throws an error if the procedure is not found or if an error occurs during the query
 */
export const getProcedureTasksService = async (procedureId) => {
  try {
    const procedure = await pool.query(
      'SELECT * FROM procedure WHERE id = $1',
      [procedureId],
    );
    if (procedure.rowCount === 0) {
      throw new Error('Procedimiento no encontrado');
    }

    const tasks = await pool.query(
      'SELECT * FROM task WHERE procedure_id = $1 ORDER BY name ASC',
      [procedureId],
    );
    return { procedure: procedure.rows[0], tasks: tasks.rows };
  } catch (error) {
    console.error('Error al obtener las tareas del procedimiento:', error);
    throw new Error(error.message);
  }
};

/**
 * Creates a new procedure.
 *
 * @param {Object} procedureData - Object containing the procedure data
 * @param {string} procedureData.name - Name of the procedure
 * @param {string} procedureData.description - Description of the procedure
 * @returns {Promise<Object>} - Created procedure object
 * @throws {Error} - Throws an error if a procedure with the same name already exists or if an error occurs during the query
 */
export const createProcedureService = async ({ name, description }) => {
  try {
    const check = await pool.query('SELECT * FROM procedure WHERE name = $1', [
      name,
    ]);
    if (check.rowCount > 0) {
      throw new Error('Ya existe un procedimiento con este nombre');
    }

    const result = await pool.query(
      'INSERT INTO procedure (name, description) VALUES ($1, $2) RETURNING *',
      [name, description],
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error al crear el procedimiento:', error);
    throw new Error(error.message);
  }
};

/**
 * Updates a procedure by ID.
 *
 * @param {number} procedureId - ID of the procedure to update
 * @param {Object} procedureData - Object containing the updated procedure data
 * @param {string} procedureData.name - New name of the procedure
 * @param {string} procedureData.description - New description of the procedure
 * @returns {Promise<Object>} - Updated procedure object
 * @throws {Error} - Throws an error if the procedure is not found or if an error occurs during the query
 */
export const updateProcedureService = async (
  procedureId,
  { name, description },
) => {
  try {
    const exists = await pool.query('SELECT * FROM procedure WHERE id = $1', [
      procedureId,
    ]);
    if (exists.rowCount === 0) {
      throw new Error('Procedimiento no encontrado');
    }

    const duplicate = await pool.query(
      'SELECT * FROM procedure WHERE name = $1 AND id != $2',
      [name, procedureId],
    );
    if (duplicate.rowCount > 0) {
      throw new Error('Ya existe un procedimiento con este nombre');
    }

    const result = await pool.query(
      'UPDATE procedure SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, procedureId],
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error al actualizar el procedimiento:', error);
    throw new Error(error.message);
  }
};

/**
 * Deletes a procedure by ID.
 *
 * @param {number} procedureId - ID of the procedure to delete
 * @throws {Error} - Throws an error if the procedure is not found or if an error occurs during the query
 * @description This function deletes a procedure from the database by its ID.
 */
export const deleteProcedureService = async (procedureId) => {
  try {
    const check = await pool.query('SELECT * FROM procedure WHERE id = $1', [
      procedureId,
    ]);
    if (check.rowCount === 0) {
      throw new Error('Procedimiento no encontrado');
    }

    await pool.query('DELETE FROM procedure WHERE id = $1', [procedureId]);
  } catch (error) {
    console.error('Error al eliminar el procedimiento:', error);
    throw new Error(error.message);
  }
};

/**
 * Starts a procedure for a client.
 *
 * @param {number} procedureId - ID of the procedure to start
 * @param {number} clientId - ID of the client
 * @returns {Promise<Object>} - Object containing the started procedure and procedure name
 * @throws {Error} - Throws an error if the client or procedure is not found, or if the procedure has already been started
 */
export const startProcedureService = async (procedureId, clientId) => {
  try {
    const client = await pool.query('SELECT * FROM client WHERE id = $1', [
      clientId,
    ]);
    if (client.rowCount === 0) {
      throw new Error('Cliente no encontrado');
    }

    const procedure = await pool.query(
      'SELECT * FROM procedure WHERE id = $1',
      [procedureId],
    );
    if (procedure.rowCount === 0) {
      throw new Error('Procedimiento no encontrado');
    }

    const alreadyStarted = await pool.query(
      'SELECT * FROM started_procedure WHERE procedure_id = $1 AND client_id = $2',
      [procedureId, clientId],
    );
    if (alreadyStarted.rowCount > 0) {
      throw new Error('Ya ha iniciado este procedimiento');
    }

    const started = await pool.query(
      "INSERT INTO started_procedure (procedure_id, client_id, status) VALUES ($1, $2, 'pending') RETURNING *",
      [procedureId, clientId],
    );

    return {
      startedProcedure: started.rows[0],
      procedureName: procedure.rows[0].name,
    };
  } catch (error) {
    console.error('Error al iniciar el procedimiento:', error);
    throw new Error(error.message);
  }
};

/**
 * Cancels a started procedure.
 *
 * @param {number} startedProcedureId - ID of the started procedure to cancel
 * @param {number} clientId - ID of the client who started the procedure
 * @returns {Promise<Object>} - Object containing the name of the canceled procedure
 * @throws {Error} - Throws an error if the started procedure is not found or if an error occurs during the query
 */
export const cancelStartedProcedureService = async (
  startedProcedureId,
  clientId,
) => {
  try {
    const started = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1 AND client_id = $2',
      [startedProcedureId, clientId],
    );
    if (started.rowCount === 0) {
      throw new Error('Procedimiento no encontrado');
    }

    await pool.query('DELETE FROM started_procedure WHERE id = $1', [
      startedProcedureId,
    ]);

    const procedure = await pool.query(
      'SELECT * FROM procedure WHERE id = $1',
      [started.rows[0].procedure_id],
    );

    return { procedureName: procedure.rows[0].name };
  } catch (error) {
    console.error('Error al cancelar el procedimiento:', error);
    throw new Error(error.message);
  }
};

/**
 * Retrieves all procedures started by a client.
 *
 * @param {number} clientId - ID of the client
 * @returns {Promise<Array>} - Array of started procedures for the client
 * @throws {Error} - Throws an error if the client is not found or if an error occurs during the query
 */
export const getMyStartedProceduresService = async (clientId) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.procedure_id, i.client_id, i.status, i.start_date, i.end_date, 
              p.name, p.description 
       FROM started_procedure i 
       JOIN procedure p ON i.procedure_id = p.id 
       WHERE client_id = $1 ORDER BY i.start_date DESC`,
      [clientId],
    );
    return result.rows;
  } catch (error) {
    console.error('Error al obtener procedimientos iniciados:', error);
    throw new Error('Error al obtener procedimientos iniciados');
  }
};

/**
 * Creates a task for a specific procedure.
 *
 * @param {number} procedureId - ID of the procedure
 * @param {Object} taskData - Object containing the task data
 * @param {string} taskData.name - Name of the task
 * @param {string} taskData.description - Description of the task
 * @param {number} taskData.xp - XP value for the task
 * @param {number} taskData.role_id - ID of the role associated with the task
 * @param {number} taskData.estimated_duration_days - Estimated duration in days
 * @param {string} taskData.difficulty - Difficulty level of the task
 * @returns {Promise<Object>} - Created task object
 * @throws {Error} - Throws an error if the procedure is not found or if an error occurs during the query
 */
export const createProcedureTaskService = async (
  procedureId,
  { name, description, xp, role_id, estimated_duration_days, difficulty },
) => {
  try {
    const procedure = await pool.query(
      'SELECT * FROM procedure WHERE id = $1',
      [procedureId],
    );
    if (procedure.rowCount === 0) {
      throw new Error('Procedimiento no encontrado');
    }

    const task = await pool.query(
      `INSERT INTO task 
        (name, description, xp, procedure_id, role_id, estimated_duration_days, difficulty) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        name,
        description,
        xp,
        procedureId,
        role_id,
        estimated_duration_days,
        difficulty,
      ],
    );
    return task.rows[0];
  } catch (error) {
    console.error('Error al crear la tarea del procedimiento:', error);
    throw new Error(error.message);
  }
};

/**
 * Retrieves all procedures started by all clients.
 */
export const getStartedProceduresService = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        ip.id AS started_procedure_id,
        p.name AS procedure_name,
        per.username AS client_username,
        ip.status,
        ip.start_date,
        ip.end_date
      FROM started_procedure ip
      JOIN procedure p ON ip.procedure_id = p.id
      JOIN person per ON ip.client_id = per.id
      ORDER BY ip.start_date DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener procedimientos iniciados:', error);
    throw new Error('Error al obtener procedimientos iniciados');
  }
};

/**
 * Retrieves tasks for a specific started procedure.
 *
 * @param {number} startedProcedureId - ID of the started procedure
 * @returns {Promise<Array>} - Array of tasks for the started procedure
 * @throws {Error} - Throws an error if the started procedure is not found or if an error occurs during the query
 */
export const getStartedProcedureTasksService = async (startedProcedureId) => {
  try {
    const started = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1',
      [startedProcedureId],
    );
    if (started.rowCount === 0) {
      throw new Error('Procedimiento iniciado no encontrado');
    }

    const result = await pool.query(
      `SELECT 
        it.id AS started_task_id,
        t.name AS task_name,
        t.description AS task_description,
        it.status,
        it.start_date,
        it.end_date,
        e.username AS employee_username,
        it.document_uploaded
       FROM started_task it
       JOIN task t ON it.task_id = t.id
       JOIN person e ON it.employee_id = e.id
       WHERE it.started_procedure_id = $1
       ORDER BY it.start_date DESC`,
      [startedProcedureId],
    );

    return result.rows;
  } catch (error) {
    console.error('Error al obtener tareas del procedimiento iniciado:', error);
    throw new Error(error.message);
  }
};

/**
 * Updates the status of a started procedure.
 *
 * @param {*} startedProcedureId - ID of the started procedure to update
 * @param {*} param1 - Object containing the new status
 * @param {*} param1.status - New status for the started procedure
 * @returns {Promise<Object>} - Updated started procedure
 * @throws {Error} - Throws an error if the started procedure is not found or if an error occurs during the update
 */
export const updateStartedProcedureStatusService = async (
  startedProcedureId,
  status,
) => {
  try {
    const started = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1',
      [startedProcedureId],
    );
    if (started.rowCount === 0) {
      throw new Error('Procedimiento iniciado no encontrado');
    }

    const result = await pool.query(
      'UPDATE started_procedure SET status = $1 WHERE id = $2 RETURNING *',
      [status, startedProcedureId],
    );

    console.log('Procedimiento iniciado actualizado:', result.rows[0]);

    return result.rows[0];
  } catch (error) {
    console.error('Error al actualizar el procedimiento iniciado:', error);
    throw new Error(error.message);
  }
};
