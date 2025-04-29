import {
  acceptTaskService,
  deleteTaskService,
  updateTaskService,
  getCompletedTasksService,
  getPendingTaskService,
  getTasksService,
  rejectTaskService,
  uploadTaskService,
  getClientStartedTasksService,
  getClientPendingTasksService,
} from '../services/task.service.js';

/**
 * Retrieves all tasks.
 *
 * Responds with:
 *  - 200 OK: If tasks are retrieved successfully.
 *  - 500 Internal Server Error: If an error occurs while retrieving tasks.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getTasks = async (req, res) => {
  try {
    const tasks = await getTasksService();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error al obtener las tareas:', error);
    res.status(500).json({ message: 'Error al obtener las tareas' });
  }
};

/**
 * Retrieves pending tasks for the authenticated employee.
 *
 * Responds with:
 *  - 200 OK: If pending tasks are retrieved successfully.
 *  - 500 Internal Server Error: If an error occurs while retrieving pending tasks.
 *
 * @param {Object} req - The HTTP request object. Expects req.user.id.
 * @param {Object} res - The HTTP response object.
 */
export const getPendingTasks = async (req, res) => {
  const employeeId = req.user.id;
  try {
    const tasks = await getPendingTaskService(employeeId);
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error al obtener las tareas pendientes:', error);
    res.status(500).json({ message: 'Error al obtener las tareas pendientes' });
  }
};

/**
 * Retrieves completed tasks for the authenticated employee.
 *
 * Responds with:
 *  - 200 OK: If completed tasks are retrieved successfully.
 *  - 500 Internal Server Error: If an error occurs while retrieving completed tasks.
 *
 * @param {Object} req - The HTTP request object. Expects req.user.id.
 * @param {Object} res - The HTTP response object.
 */
export const getCompletedTasks = async (req, res) => {
  const employeeId = req.user.id;
  try {
    const completedTasks = await getCompletedTasksService(employeeId);
    res.status(200).json(completedTasks);
  } catch (error) {
    console.error('Error al obtener las tareas completadas:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener las tareas completadas' });
  }
};

/**
 * Accepts a task.
 *
 * Responds with:
 *  - 200 OK: If the task is accepted successfully.
 *  - 500 Internal Server Error: If an error occurs while accepting the task.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.startedTaskId and req.body.socketId.
 * @param {Object} res - The HTTP response object.
 */
export const acceptTask = async (req, res) => {
  const { startedTaskId } = req.params;
  const employeeId = req.user.id;
  const { socketId } = req.body;
  try {
    const updatedTask = await acceptTaskService(
      startedTaskId,
      employeeId,
      socketId,
      req.app.locals.io,
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error al aceptar la tarea:', error);
    res.status(500).json({ message: 'Error al aceptar la tarea' });
  }
};

/**
 * Rejects a task.
 *
 * Responds with:
 *  - 200 OK: If the task is rejected successfully.
 *  - 500 Internal Server Error: If an error occurs while rejecting the task.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.startedTaskId, req.body.reason, and req.body.socketId.
 * @param {Object} res - The HTTP response object.
 */
export const rejectTask = async (req, res) => {
  const { startedTaskId } = req.params;
  const employeeId = req.user.id;
  const { reason, socketId } = req.body;
  try {
    const updatedTask = await rejectTaskService(
      startedTaskId,
      employeeId,
      reason,
      socketId,
      req.app.locals.io,
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error al rechazar la tarea:', error);
    res.status(500).json({ message: 'Error al rechazar la tarea' });
  }
};

/**
 * Deletes a task.
 *
 * Responds with:
 *  - 204 No Content: If the task is deleted successfully.
 *  - 500 Internal Server Error: If an error occurs while deleting the task.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.taskId.
 * @param {Object} res - The HTTP response object.
 */
export const deleteTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    await deleteTaskService(taskId);
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Tarea no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error al eliminar la tarea:', error);
    res.status(500).json({ message: 'Error al eliminar la tarea' });
  }
};

/**
 * Uploads a document for a task.
 *
 * Responds with:
 *  - 200 OK: If the document is uploaded and the task is started successfully.
 *  - 500 Internal Server Error: If an error occurs while uploading the task document.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.startedProcedureId, req.params.taskId, req.user.id, and req.file.
 * @param {Object} res - The HTTP response object.
 */
export const uploadTask = async (req, res) => {
  const { startedProcedureId, taskId } = req.params;
  const clientId = req.user.id;
  try {
    const startedTask = await uploadTaskService(
      clientId,
      startedProcedureId,
      taskId,
      req.file,
    );
    res
      .status(200)
      .json({ message: 'Tarea iniciada correctamente', task: startedTask });
  } catch (error) {
    if (error.message === 'La tarea ya está completada o pendiente') {
      console.error('La tarea ya está completada o pendiente:', error);
      res.status(409).json({ message: error.message });
    }
    else { // Handle other errors
      console.error('Error al subir el documento de la tarea:', error);
      res.status(500).json({ message: 'Error al subir el documento de la tarea' });
    }
  }
};

/**
 * Updates a task's details.
 *
 * Responds with:
 *  - 200 OK: If the task is updated successfully.
 *  - 500 Internal Server Error: If an error occurs while updating the task.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.taskId and task details in req.body.
 * @param {Object} res - The HTTP response object.
 */
export const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const {
    name,
    description,
    xp,
    procedure_id,
    role_id,
    estimated_duration_days,
    difficulty,
  } = req.body;
  try {
    const updatedTask = await updateTaskService(taskId, {
      name,
      description,
      xp,
      procedure_id,
      role_id,
      estimated_duration_days,
      difficulty,
    });
    res.status(200).json(updatedTask);
  } catch (error) {
    if (error.message === 'Tarea no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al actualizar la tarea' });
  }
};

// Controlador para obtener las tareas y su estado
export const getClientStartedTasks = async (req, res) => {
  const { startedProcedureId } = req.params;
  const clientId = req.user.id;


  try {
    // Obtener las tareas iniciadas para el procedimiento iniciado y cliente
    const result = await getClientStartedTasksService(startedProcedureId, clientId);

    // Responder con dos arrays: tareas completadas o con documentos, y tareas sin documentos o rechazadas
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener el estado de las tareas del trámite:', error);
    res.status(500).json({ message: error.message || 'Error al obtener el estado de las tareas' });
  }
};

export const getClientPendingTasks = async (req, res) => {
  const { startedProcedureId } = req.params;
  const clientId = req.user.id;

  try {
    // Obtener las tareas iniciadas para el procedimiento iniciado y cliente
    const result = await getClientPendingTasksService(startedProcedureId, clientId);

    // Responder con dos arrays: tareas completadas o con documentos, y tareas sin documentos o rechazadas
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener el estado de las tareas del trámite:', error);
    res.status(500).json({ message: error.message || 'Error al obtener el estado de las tareas' });
  }
};

