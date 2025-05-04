import { pool } from '../databases/db.js';
import { createAndSendNotificationService } from './notification.service.js';
import { handleXPAndNotificationService } from './gamification.service.js';
import { selectEmployeeByRoleService } from './worker.service.js';
import { updateStartedProcedureStatusService } from './procedure.service.js';

/**
 * Retrieves all tasks.
 *
 * @returns {Promise<Array>} An array of tasks.
 * @throws {Error} Throws an error if tasks cannot be retrieved.
 */
export const getTasksService = async () => {
  try {
    const tasks = await pool.query('SELECT * FROM task');
    return tasks.rows;
  } catch (error) {
    console.error('Error al obtener las tareas:', error);
    throw new Error('Error al obtener las tareas');
  }
};

/**
 * Retrieves pending tasks for a given employee.
 *
 * @param {number} employeeId - The ID of the employee.
 * @returns {Promise<Array>} An array of pending tasks with time left information.
 * @throws {Error} Throws an error if pending tasks cannot be fetched.
 */
export const getPendingTaskService = async (employeeId) => {
  try {
    const tasksQuery = await pool.query(
      `
      SELECT
        it.id AS started_task_id,
        it.status AS started_task_status,
        it.start_date AS started_task_start,
        it.document_uploaded,
        t.id AS task_id,
        t.name AS task_name,
        t.description AS task_description,
        t.xp,
        t.estimated_duration_days,
        t.difficulty,
        p.id AS procedure_id,
        p.name AS procedure_name,
        p.description AS procedure_description
      FROM started_task it
      JOIN task t ON it.task_id = t.id
      JOIN started_procedure ip ON it.started_procedure_id = ip.id
      JOIN procedure p ON ip.procedure_id = p.id
      WHERE it.employee_id = $1
        AND it.status = 'pending'
    `,
      [employeeId],
    );

    const tasks = tasksQuery.rows;
    const now = new Date();

    return tasks
      .map((row) => {
        const timeLeftMs =
          new Date(row.start_date).getTime() +
          row.estimated_duration_days * 24 * 60 * 60 * 1000 -
          now.getTime();
        return {
          ...row,
          time_left_ms: timeLeftMs,
          time_left_days: (timeLeftMs / (24 * 60 * 60 * 1000)).toFixed(2),
        };
      })
      .sort((a, b) => a.time_left_ms - b.time_left_ms);
  } catch (error) {
    console.error('Error al obtener las tareas pendientes:', error);
    throw new Error('Error al obtener las tareas pendientes');
  }
};

/**
 * Retrieves completed tasks for a given employee.
 *
 * @param {number} employeeId - The ID of the employee.
 * @returns {Promise<Array>} An array of completed tasks.
 * @throws {Error} Throws an error if completed tasks cannot be retrieved.
 */
export const getCompletedTasksService = async (employeeId) => {
  try {
    const completedTasksQuery = await pool.query(
      `
      SELECT 
        i.id AS started_task_id,
        t.id AS task_id,
        t.name AS task_name,
        t.description AS task_description,
        t.xp,
        t.estimated_duration_days,
        t.difficulty,
        i.document_uploaded,
        i.start_date,
        i.end_date,
        i.status
      FROM started_task i
      JOIN task t ON i.task_id = t.id
      WHERE i.employee_id = $1 AND i.status != 'pending'
      ORDER BY i.end_date DESC
    `,
      [employeeId],
    );
    return completedTasksQuery.rows;
  } catch (error) {
    console.error('Error al obtener las tareas completadas:', error);
    throw new Error('Error al obtener las tareas completadas');
  }
};

/**
 * Accepts a pending task and updates its status to completed.
 *
 * @param {number} startedTaskId - The ID of the started task.
 * @param {number} employeeId - The ID of the employee.
 * @param {string} socketId - The socket ID for notifications.
 * @returns {Promise<Object>} The updated started task.
 * @throws {Error} Throws an error if the task cannot be completed.
 */
export const acceptTaskService = async (
  startedTaskId,
  employeeId,
  socketId,
  io,
) => {
  try {
    // Verify that the task is pending and belongs to the employee
    const startedTask = await getStartedTaskByStatusService(
      startedTaskId,
      employeeId,
      'pending',
    );

    // Update the task status to "completed"
    const updatedStartedTask = await updateStartedTaskStatusService(
      startedTaskId,
      'completed',
    );

    // Check if the task is completed and update the procedure status accordingly

    // Get the number of completed tasks for the started procedure
    const completedTasks = await pool.query(
      "SELECT COUNT(*) FROM started_task WHERE started_procedure_id = $1 AND status = 'completed'",
      [startedTask.started_procedure_id],
    );

    const procedureId = await pool.query(
      'SELECT procedure_id FROM started_procedure WHERE id = $1',
      [startedTask.started_procedure_id],
    );

    const procedure = await pool.query(
      'SELECT * FROM procedure WHERE id = $1',
      [procedureId.rows[0].procedure_id],
    );

    const startedProcedure = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1',
      [startedTask.started_procedure_id],
    );

    // Get the total number of tasks for the procedure
    const totalTasks = await pool.query(
      'SELECT COUNT(*) FROM task WHERE procedure_id = $1',
      [procedureId.rows[0].procedure_id],
    );

    const taskNameResult = await pool.query(
      'SELECT name FROM task WHERE id = $1',
      [startedTask.task_id],
    );

    const taskName = taskNameResult.rows[0].name;

    // Notify the client about the task completion
    const clientId = startedProcedure.rows[0].client_id;
    await createAndSendNotificationService(
      clientId,
      `La tarea "${taskName}" del trámite "${procedure.rows[0].name}" ha sido completada`,
    );

    let newStartedProcedureStatus = 'in_progress';

    // Check if all tasks are completed
    if (
      parseInt(completedTasks.rows[0].count) ===
      parseInt(totalTasks.rows[0].count)
    ) {
      // If all tasks are completed, update the procedure status to "completed" and notify the client
      newStartedProcedureStatus = 'completed';

      // Update the end date of the started procedure
      const endDate = new Date();
      await pool.query(
        'UPDATE started_procedure SET end_date = $1 WHERE id = $2',
        [endDate, startedTask.started_procedure_id],
      );

      // Notify the client about the task completion or procedure completion
      await createAndSendNotificationService(
        startedProcedure.rows[0].client_id,
        `El trámite "${procedure.rows[0].name}" ha sido completado`,
      );
    }

    // Update the procedure status
    await updateStartedProcedureStatusService(
      startedProcedure.rows[0].id,
      newStartedProcedureStatus,
    );

    const task = await getTaskService(startedTask.task_id);

    // Notify the employee about the task completion and update XP
    await handleXPAndNotificationService(
      employeeId,
      task,
      updatedStartedTask,
      socketId,
      io,
      true,
    );

    return updatedStartedTask;
  } catch (error) {
    console.error('Error al completar la tarea:', error);
    throw new Error('Error al completar la tarea');
  }
};

/**
 * Rejects a pending task and updates its status to rejected.
 *
 * @param {number} startedTaskId - The ID of the started task.
 * @param {number} employeeId - The ID of the employee.
 * @param {string} reason - The reason for rejection.
 * @param {string} socketId - The socket ID for notifications.
 * @returns {Promise<Object>} The updated started task.
 * @throws {Error} Throws an error if the task cannot be rejected.
 */
export const rejectTaskService = async (
  startedTaskId,
  employeeId,
  reason,
  socketId,
  io,
) => {
  try {
    const startedTask = await getStartedTaskByStatusService(
      startedTaskId,
      employeeId,
      'pending',
    );
    const updatedTask = await updateStartedTaskStatusService(
      startedTaskId,
      'rejected',
      reason,
    );

    // Update the procedure status to "in_progress" if the task is rejected
    await updateStartedProcedureStatusService(
      startedTask.started_procedure_id,
      'in_progress',
    );

    const clientId = await pool.query(
      'SELECT client_id FROM started_procedure WHERE id = $1',
      [startedTask.started_procedure_id],
    );

    const taskName = await pool.query('SELECT name FROM task WHERE id = $1', [
      startedTask.task_id,
    ]);

    const procedureName = await pool.query(
      'SELECT name FROM procedure WHERE id = $1',
      [startedTask.started_procedure_id],
    );

    // Notify the client about the task rejection
    await createAndSendNotificationService(
      clientId.rows[0].client_id,
      `La tarea "${taskName.rows[0].name}" del trámite "${procedureName.rows[0].name}" ha sido rechazada por el siguiente motivo: ${reason}`,
    );

    const taskInfo = await getTaskService(startedTask.task_id);

    // Notify the employee about the task rejection and update XP
    await handleXPAndNotificationService(
      employeeId,
      taskInfo,
      updatedTask,
      socketId,
      io,
      false,
    );

    return updatedTask;
  } catch (error) {
    console.error('Error al rechazar la tarea:', error);
    throw new Error('Error al rechazar la tarea');
  }
};

/**
 * Updates a task's details.
 *
 * @param {number|string} taskId - The ID of the task to update.
 * @param {Object} updateData - The new details for the task.
 * @param {string} updateData.name - The new name of the task.
 * @param {string} updateData.description - The new description of the task.
 * @param {number} updateData.xp - The new XP value for the task.
 * @param {number} updateData.procedure_id - The procedure ID associated with the task.
 * @param {number} updateData.role_id - The role ID associated with the task.
 * @param {number} updateData.estimated_duration_days - The new estimated duration in days.
 * @param {string} updateData.difficulty - The new difficulty level.
 * @returns {Promise<Object>} The updated task.
 * @throws {Error} Throws an error if the task cannot be updated.
 */
export const updateTaskService = async (
  taskId,
  {
    name,
    description,
    xp,
    procedure_id,
    role_id,
    estimated_duration_days,
    difficulty,
  },
) => {
  try {
    // Verify that the task exists
    await getTaskService(taskId);
    // Check if the procedure exists
    const procedureCheck = await pool.query(
      'SELECT * FROM procedure WHERE id = $1',
      [procedure_id],
    );

    if (procedureCheck.rowCount === 0) {
      throw new Error('Procedimiento no encontrado');
    }

    // Check if the task name already exists for the procedure
    const taskNameCheck = await pool.query(
      'SELECT * FROM task WHERE name = $1 AND procedure_id = $2 AND id != $3',
      [name, procedure_id, taskId],
    );
    if (taskNameCheck.rowCount > 0) {
      throw new Error(
        'Ya existe una tarea con este nombre para este procedimiento',
      );
    }

    // Check if the role exists
    const roleCheck = await pool.query('SELECT * FROM role WHERE id = $1', [
      role_id,
    ]);
    if (roleCheck.rowCount === 0) {
      throw new Error('Rol no encontrado');
    }
    // Update the task details
    const updatedTask = await pool.query(
      'UPDATE task SET name = $1, description = $2, xp = $3, procedure_id = $4, role_id = $5, estimated_duration_days = $6, difficulty = $7 WHERE id = $8 RETURNING *',
      [
        name,
        description,
        xp,
        procedure_id,
        role_id,
        estimated_duration_days,
        difficulty,
        taskId,
      ],
    );
    return updatedTask.rows[0];
  } catch (error) {
    console.error('Error al actualizar la tarea:', error);
    throw new Error(error.message || 'Error al actualizar la tarea');
  }
};

/**
 * Deletes a task.
 *
 * @param {number|string} taskId - The ID of the task to delete.
 * @returns {Promise<void>} Resolves when the task is deleted.
 * @throws {Error} Throws an error if the task cannot be deleted.
 */
export const deleteTaskService = async (taskId) => {
  try {
    await getTaskService(taskId); // Ensure task exists
    await pool.query('DELETE FROM task WHERE id = $1', [taskId]);
  } catch (error) {
    console.error('Error al eliminar la tarea:', error);
    throw new Error(error.message || 'Error al eliminar la tarea');
  }
};

/**
 * Uploads a task document and assigns the task to an employee.
 *
 * @param {number} clientId - The client ID.
 * @param {number} startedProcedureId - The ID of the started procedure.
 * @param {number|string} taskId - The ID of the task.
 * @param {Object} file - The uploaded file object.
 * @returns {Promise<Object>} The started task.
 * @throws {Error} Throws an error if the document upload fails or if the task assignment fails.
 */
export const uploadTaskService = async (
  clientId,
  startedProcedureId,
  taskId,
  file,
) => {
  try {
    if (!file) {
      throw new Error('No se ha subido ningún archivo');
    }

    const documentUrl = file.location;

    // Check if the client has started the procedure
    const procedureCheck = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1 AND client_id = $2',
      [startedProcedureId, clientId],
    );

    if (procedureCheck.rowCount === 0) {
      throw new Error('El procedimiento no ha sido iniciado por este cliente');
    }

    const taskCheck = await pool.query(
      'SELECT * FROM task WHERE id = $1 AND procedure_id = (SELECT procedure_id FROM started_procedure WHERE id = $2)',
      [taskId, startedProcedureId],
    );

    if (taskCheck.rowCount === 0) {
      throw new Error('Tarea no encontrada para este procedimiento');
    }

    // Check if the task has already been completed or is pending
    const startedTaskCheck = await pool.query(
      "SELECT * FROM started_task WHERE task_id = $1 AND started_procedure_id = $2 AND (status = 'completed' OR status = 'pending')",
      [taskId, startedProcedureId],
    );

    if (startedTaskCheck.rowCount > 0) {
      throw new Error('La tarea ya está completada o pendiente');
    }

    const roleId = taskCheck.rows[0].role_id;
    const employeeId = await selectEmployeeByRoleService(roleId);
    if (!employeeId) {
      throw new Error('No se encontró un empleado disponible');
    }

    const status = 'pending';

    const task = await pool.query(
      `INSERT INTO started_task 
      (started_procedure_id, task_id, employee_id, status, document_uploaded) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [startedProcedureId, taskId, employeeId, status, documentUrl],
    );

    await createAndSendNotificationService(
      employeeId,
      `Se te ha asignado la tarea: "${taskCheck.rows[0].name}"`,
      null,
    );

    return task.rows[0];
  } catch (error) {
    console.error('Error al subir el documento de la tarea:', error);
    throw new Error(error.message);
  }
};

/**
 * Retrieves the details of a task by its ID.
 *
 * @param {number|string} taskId - The ID of the task.
 * @returns {Promise<Object>} The task details.
 * @throws {Error} Throws an error if the task is not found.
 */
export const getTaskService = async (taskId) => {
  try {
    const result = await pool.query('SELECT * FROM task WHERE id = $1', [
      taskId,
    ]);
    if (result.rowCount === 0) {
      throw new Error('Tarea no encontrada');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error al obtener la información de la tarea:', error);
    throw error;
  }
};

/**
 * Retrieves a started task by its ID.
 *
 * @param {number|string} startedTaskId - The ID of the started task.
 * @returns {Promise<Object>} The started task details.
 * @throws {Error} Throws an error if the started task is not found.
 */
export const getStartedTaskService = async (startedTaskId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM started_task WHERE id = $1',
      [startedTaskId],
    );
    if (result.rowCount === 0) {
      throw new Error(`Tarea iniciada con ID ${startedTaskId} no encontrada`);
    }
    return result.rows[0];
  } catch (error) {
    console.error(
      'Error al obtener la información de la tarea iniciada:',
      error,
    );
    throw new Error(
      'Error al obtener la información de la tarea iniciada: ' + error.message,
    );
  }
};

/**
 * Retrieves a started task by its ID, employee ID, and expected status.
 *
 * @param {number|string} startedTaskId - The ID of the started task.
 * @param {number} employeeId - The ID of the employee.
 * @param {string} expectedStatus - The expected status of the task.
 * @returns {Promise<Object>} The started task data.
 * @throws {Error} Throws an error if the task is not found or not pending for this employee.
 */
export const getStartedTaskByStatusService = async (
  startedTaskId,
  employeeId,
  expectedStatus,
) => {
  const taskQuery = await pool.query(
    `SELECT * FROM started_task
     WHERE id = $1 AND employee_id = $2 AND status = $3`,
    [startedTaskId, employeeId, expectedStatus],
  );

  if (taskQuery.rowCount === 0) {
    throw new Error(
      'Tarea no encontrada o no está pendiente para este empleado',
    );
  }

  return taskQuery.rows[0];
};

/**
 * Updates the status of a started task.
 *
 * @param {number|string} startedTaskId - The ID of the started task.
 * @param {string} status - The new status for the task.
 * @param {string|null} [reason=null] - The reason for rejection (if applicable).
 * @returns {Promise<Object>} The updated started task.
 * @throws {Error} Throws an error if the task status cannot be updated.
 */
export const updateStartedTaskStatusService = async (
  startedTaskId,
  status,
  reason = null,
) => {
  const query = `
    UPDATE started_task
    SET status = $1, end_date = $2, rejected_reason = $3
    WHERE id = $4 RETURNING *
  `;
  const result = await pool.query(query, [
    status,
    new Date(),
    reason,
    startedTaskId,
  ]);

  if (result.rowCount === 0) {
    throw new Error('Error al actualizar el estado de la tarea');
  }

  return result.rows[0];
};

/**
 * Retrieves tasks started by a client for a specific procedure.
 *
 * @param {*} startedProcedureId - The ID of the started procedure.
 * @param {*} clientId - The ID of the client.
 * @throws {Error} Throws an error if the procedure has not been started by the client or if it does not exist.
 * @throws {Error} Throws an error if there is an issue querying the database.
 * @throws {Error} Throws an error if there is an issue with the query.
 * @returns {Promise<Array>} An array of tasks started by the client.
 */
export const getClientStartedTasksService = async (
  startedProcedureId,
  clientId,
) => {
  try {
    // Check if the client has started the procedure
    const procedureCheck = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1 AND client_id = $2',
      [startedProcedureId, clientId],
    );
    if (procedureCheck.rowCount === 0) {
      throw new Error('El procedimiento no ha sido iniciado por este cliente');
    }

    // Check if the started procedure exists
    const startedProcedureCheck = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1',
      [startedProcedureId],
    );

    if (startedProcedureCheck.rowCount === 0) {
      throw new Error('El procedimiento iniciado no existe');
    }

    const tasksQuery = await pool.query(
      `
        SELECT
          st.id,
          st.started_procedure_id,
          st.task_id,
          st.employee_id,
          st.status, 
          st.document_uploaded,
          st.rejected_reason,
          st.start_date,      
          st.end_date,        
          t.name              AS task_name,
          t.description       AS task_description,
          t.xp                AS task_xp,
          t.procedure_id      AS task_procedure_id,
          t.role_id           AS task_role_id,
          t.estimated_duration_days AS task_estimated_duration,
          t.difficulty        AS task_difficulty
        FROM started_task st
        INNER JOIN task t
          ON st.task_id = t.id
        WHERE
          st.started_procedure_id = $1
          AND st.status != 'rejected' ORDER BY st.start_date DESC
      `,
      [startedProcedureId],
    );

    const tasksWithInfo = tasksQuery.rows;
    return tasksWithInfo;
  } catch (error) {
    console.error('Error al obtener las tareas iniciadas:', error);
    throw new Error(error.message || 'Error al obtener las tareas iniciadas');
  }
};

/**
 * Retrieves pending tasks for a client.
 *
 * @param {*} startedProcedureId - The ID of the started procedure.
 * @param {*} clientId - The ID of the client.
 * @returns {Promise<Array>} An array of pending tasks.
 * @throws {Error} Throws an error if the procedure has not been started by the client or if it does not exist.
 * @throws {Error} Throws an error if there is an issue querying the database.
 * @throws {Error} Throws an error if there is an issue with the query.
 */
export const getClientPendingTasksService = async (
  startedProcedureId,
  clientId,
) => {
  try {
    // Check if the client has started the procedure
    const procedureCheck = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1 AND client_id = $2',
      [startedProcedureId, clientId],
    );
    if (procedureCheck.rowCount === 0) {
      throw new Error('El procedimiento no ha sido iniciado por este cliente');
    }

    // Check if the started procedure exists
    const startedProcedureCheck = await pool.query(
      'SELECT * FROM started_procedure WHERE id = $1',
      [startedProcedureId],
    );

    if (startedProcedureCheck.rowCount === 0) {
      throw new Error('El procedimiento iniciado no existe');
    }

    const procedureId = await pool.query(
      'SELECT procedure_id FROM started_procedure WHERE id = $1',
      [startedProcedureId],
    );

    // Get the tasks of the procedure whose id is not in ( select ids from started tasks where status is pending or completed)
    const tasksQuery = await pool.query(
      `
      SELECT * FROM task
      WHERE procedure_id = $1
        AND id NOT IN (
          SELECT task_id FROM started_task
          WHERE started_procedure_id = $2
            AND status IN ('pending', 'completed') ORDER BY start_date DESC
        )
    `,
      [procedureId.rows[0].procedure_id, startedProcedureId],
    );

    return tasksQuery.rows;
  } catch (error) {
    console.error('Error al obtener las tareas pendientes:', error);
    throw new Error(error.message || 'Error al obtener las tareas pendientes');
  }
};
