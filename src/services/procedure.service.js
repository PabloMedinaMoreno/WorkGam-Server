import { pool } from "../databases/db.js";

/**
 * Retrieves all procedures.
 */
export const getProceduresService = async () => {
  try {
    const procedures = await pool.query("SELECT * FROM procedure");
    return procedures.rows;
  } catch (error) {
    console.error("Error al obtener los procedimientos:", error);
    throw new Error("Error al obtener los procedimientos");
  }
};

/**
 * Retrieves the tasks for a specific procedure.
 */
export const getProcedureTasksService = async (procedureId) => {
  try {
    const procedure = await pool.query("SELECT * FROM procedure WHERE id = $1", [procedureId]);
    if (procedure.rowCount === 0) throw new Error("Procedimiento no encontrado");

    const tasks = await pool.query("SELECT * FROM task WHERE procedure_id = $1", [procedureId]);
    return { procedure: procedure.rows[0], tasks: tasks.rows };
  } catch (error) {
    console.error("Error al obtener las tareas del procedimiento:", error);
    throw new Error(error.message);
  }
};

/**
 * Creates a new procedure.
 */
export const createProcedureService = async ({ name, description }) => {
  try {
    const check = await pool.query("SELECT * FROM procedure WHERE name = $1", [name]);
    if (check.rowCount > 0) throw new Error("Ya existe un procedimiento con este nombre");

    const result = await pool.query(
      "INSERT INTO procedure (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error al crear el procedimiento:", error);
    throw new Error(error.message);
  }
};

/**
 * Updates a procedure by ID.
 */
export const updateProcedureService = async (procedureId, { name, description }) => {
  try {
    const exists = await pool.query("SELECT * FROM procedure WHERE id = $1", [procedureId]);
    if (exists.rowCount === 0) throw new Error("Procedimiento no encontrado");

    const duplicate = await pool.query(
      "SELECT * FROM procedure WHERE name = $1 AND id != $2",
      [name, procedureId]
    );
    if (duplicate.rowCount > 0) throw new Error("Ya existe un procedimiento con este nombre");

    const result = await pool.query(
      "UPDATE procedure SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, procedureId]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error al actualizar el procedimiento:", error);
    throw new Error(error.message);
  }
};

/**
 * Deletes a procedure by ID.
 */
export const deleteProcedureService = async (procedureId) => {
  try {
    const check = await pool.query("SELECT * FROM procedure WHERE id = $1", [procedureId]);
    if (check.rowCount === 0) throw new Error("Procedimiento no encontrado");

    await pool.query("DELETE FROM procedure WHERE id = $1", [procedureId]);
  } catch (error) {
    console.error("Error al eliminar el procedimiento:", error);
    throw new Error(error.message);
  }
};

/**
 * Starts a procedure for a client.
 */
export const startProcedureService = async (procedureId, clientId) => {
  try {
    const client = await pool.query("SELECT * FROM client WHERE id = $1", [clientId]);
    if (client.rowCount === 0) throw new Error("Cliente no encontrado");

    const procedure = await pool.query("SELECT * FROM procedure WHERE id = $1", [procedureId]);
    if (procedure.rowCount === 0) throw new Error("Procedimiento no encontrado");

    const alreadyStarted = await pool.query(
      "SELECT * FROM started_procedure WHERE procedure_id = $1 AND client_id = $2",
      [procedureId, clientId]
    );
    if (alreadyStarted.rowCount > 0) throw new Error("Ya ha iniciado este procedimiento");

    const started = await pool.query(
      "INSERT INTO started_procedure (procedure_id, client_id, status) VALUES ($1, $2, 'pending') RETURNING *",
      [procedureId, clientId]
    );

    return {
      startedProcedure: started.rows[0],
      procedureName: procedure.rows[0].name,
    };
  } catch (error) {
    console.error("Error al iniciar el procedimiento:", error);
    throw new Error(error.message);
  }
};

/**
 * Cancels a started procedure.
 */
export const cancelStartedProcedureService = async (startedProcedureId, clientId) => {
  try {
    const started = await pool.query(
      "SELECT * FROM started_procedure WHERE id = $1 AND client_id = $2",
      [startedProcedureId, clientId]
    );
    if (started.rowCount === 0) throw new Error("Procedimiento no encontrado");

    await pool.query("DELETE FROM started_procedure WHERE id = $1", [startedProcedureId]);

    const procedure = await pool.query(
      "SELECT * FROM procedure WHERE id = $1",
      [started.rows[0].procedure_id]
    );

    return { procedureName: procedure.rows[0].name };
  } catch (error) {
    console.error("Error al cancelar el procedimiento:", error);
    throw new Error(error.message);
  }
};

/**
 * Retrieves all procedures started by a client.
 */
export const getMyStartedProceduresService = async (clientId) => {
  try {
    const result = await pool.query(
      `SELECT i.id, i.procedure_id, i.client_id, i.status, i.start_date, i.end_date, 
              p.name, p.description 
       FROM started_procedure i 
       JOIN procedure p ON i.procedure_id = p.id 
       WHERE client_id = $1`,
      [clientId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error al obtener procedimientos iniciados:", error);
    throw new Error("Error al obtener procedimientos iniciados");
  }
};

/**
 * Creates a task for a specific procedure.
 */
export const createProcedureTaskService = async (
  procedureId,
  { name, description, xp, role_id, estimated_duration_days, difficulty }
) => {
  try {
    const procedure = await pool.query("SELECT * FROM procedure WHERE id = $1", [procedureId]);
    if (procedure.rowCount === 0) throw new Error("Procedimiento no encontrado");

    const task = await pool.query(
      `INSERT INTO task 
        (name, description, xp, procedure_id, role_id, estimated_duration_days, difficulty) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, description, xp, procedureId, role_id, estimated_duration_days, difficulty]
    );
    return task.rows[0];
  } catch (error) {
    console.error("Error al crear la tarea del procedimiento:", error);
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
    console.error("Error al obtener procedimientos iniciados:", error);
    throw new Error("Error al obtener procedimientos iniciados");
  }
};

/**
 * Retrieves tasks for a specific started procedure.
 */
export const getStartedProcedureTasksService = async (startedProcedureId) => {
  try {
    const started = await pool.query("SELECT * FROM started_procedure WHERE id = $1", [
      startedProcedureId,
    ]);
    if (started.rowCount === 0) throw new Error("Procedimiento iniciado no encontrado");

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
       ORDER BY it.start_date ASC`,
      [startedProcedureId]
    );

    return result.rows;
  } catch (error) {
    console.error("Error al obtener tareas del procedimiento iniciado:", error);
    throw new Error(error.message);
  }
};

/**
 * Updates the status of a started procedure.
 * @param {*} startedProcedureId - ID of the started procedure to update
 * @param {*} param1 - Object containing the new status
 * @param {*} param1.status - New status for the started procedure
 * @returns {Promise<Object>} - Updated started procedure
 * @throws {Error} - Throws an error if the started procedure is not found or if an error occurs during the update
 */
export const updateStartedProcedureStatusService = async (startedProcedureId, status) => {
  try {
    const started = await pool.query(
      "SELECT * FROM started_procedure WHERE id = $1",
      [startedProcedureId]
    );
    if (started.rowCount === 0) throw new Error("Procedimiento iniciado no encontrado");

    const result = await pool.query(
      "UPDATE started_procedure SET status = $1 WHERE id = $2 RETURNING *",
      [status, startedProcedureId]
    );

    console.log("Procedimiento iniciado actualizado:", result.rows[0]);
    
    return result.rows[0];
  } catch (error) {
    console.error("Error al actualizar el procedimiento iniciado:", error);
    throw new Error(error.message);
  }
}
