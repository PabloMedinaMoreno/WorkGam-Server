import {
  getProceduresService,
  getProcedureTasksService,
  createProcedureService,
  updateProcedureService,
  deleteProcedureService,
  startProcedureService,
  cancelStartedProcedureService,
  getMyStartedProceduresService,
  createProcedureTaskService,
  getStartedProceduresService,
  getStartedProcedureTasksService,
} from '../services/procedure.service.js';
import { createAndSendNotificationService } from '../services/notification.service.js';

/**
 * Retrieves all procedures.
 *
 * Responds with:
 *   - 200 OK: If procedures are retrieved successfully.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getProcedures = async (req, res) => {
  try {
    const procedures = await getProceduresService();
    res.status(200).json(procedures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al recuperar los procedimientos' });
  }
};

/**
 * Retrieves the tasks of a procedure.
 *
 * Responds with:
 *   - 200 OK: If the procedure and its tasks are retrieved successfully.
 *   - 404 Not Found: If the procedure is not found.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getProcedureTasks = async (req, res) => {
  const { procedureId } = req.params;
  try {
    const result = await getProcedureTasksService(procedureId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    if (error.message === 'Procedimiento no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res
      .status(500)
      .json({ message: 'Error al recuperar las tareas del procedimiento' });
  }
};

/**
 * Creates a new procedure.
 *
 * Responds with:
 *   - 201 Created: If the procedure is created successfully.
 *   - 400 Bad Request: If required fields are missing.
 *   - 409 Conflict: If a procedure with the same name already exists.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const createProcedure = async (req, res) => {
  const { name, description } = req.body;
  try {
    const procedure = await createProcedureService({ name, description });
    res.status(201).json(procedure);
  } catch (error) {
    console.error(error);
    if (error.message === 'Ya existe un procedimiento con este nombre') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al crear el procedimiento' });
  }
};

/**
 * Updates an existing procedure.
 *
 * Responds with:
 *   - 200 OK: If the procedure is updated successfully.
 *   - 400 Bad Request: If required fields are missing.
 *   - 404 Not Found: If the procedure is not found.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const updateProcedure = async (req, res) => {
  const { procedureId } = req.params;
  const { name, description } = req.body;
  try {
    const updatedProcedure = await updateProcedureService(procedureId, {
      name,
      description,
    });
    res.status(200).json(updatedProcedure);
  } catch (error) {
    console.error(error);
    if (error.message === 'Procedimiento no encontrado') {
      return res.status(404).json({ message: error.message });
    } else if (error.message === 'Ya existe un procedimiento con este nombre') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al actualizar el procedimiento' });
  }
};

/**
 * Deletes a procedure.
 *
 * Responds with:
 *   - 204 No Content: If the procedure is deleted successfully.
 *   - 404 Not Found: If the procedure is not found.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const deleteProcedure = async (req, res) => {
  const { procedureId } = req.params;
  try {
    await deleteProcedureService(procedureId);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    if (error.message === 'Procedimiento no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al eliminar el procedimiento' });
  }
};

/**
 * Starts a procedure.
 *
 * Responds with:
 *   - 201 Created: If the procedure is started successfully.
 *   - 404 Not Found: If the client or procedure is not found.
 *   - 409 Conflict: If the client has already started the procedure.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const startProcedure = async (req, res) => {
  const { procedureId } = req.params;
  const clientId = req.user.id;
  const { socketId } = req.body;
  try {
    const result = await startProcedureService(procedureId, clientId);
    const io = req.app.locals.io;
    await createAndSendNotificationService(
      clientId,
      `Ha iniciado el procedimiento "${result.procedureName}"`,
      io,
      socketId,
    );
    res.status(201).json(result.startedProcedure);
  } catch (error) {
    console.error('Error al iniciar el procedimiento:', error);
    if (
      error.message === 'Cliente no encontrado' ||
      error.message === 'Procedimiento no encontrado'
    ) {
      return res
        .status(404)
        .json({ message: 'Cliente o procedimiento no encontrado' });
    }
    if (error.message === 'Ya ha iniciado este procedimiento') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al iniciar el procedimiento' });
  }
};

/**
 * Cancels a started procedure.
 *
 * Responds with:
 *   - 200 OK: If the procedure is canceled successfully.
 *   - 404 Not Found: If the started procedure is not found.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const cancelStartedProcedure = async (req, res) => {
  const { startedProcedureId } = req.params;
  const clientId = req.user.id;
  const { socketId } = req.body;
  try {
    const result = await cancelStartedProcedureService(
      startedProcedureId,
      clientId,
    );
    const io = req.app.locals.io;
    await createAndSendNotificationService(
      clientId,
      `Ha cancelado el procedimiento "${result.procedureName}"`,
      io,
      socketId,
    );
    res.status(200).json({ message: 'Procedimiento cancelado correctamente' });
  } catch (error) {
    console.error(error);
    if (error.message === 'Procedimiento no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al cancelar el procedimiento' });
  }
};

/**
 * Retrieves the procedures started by the client.
 *
 * Responds with:
 *   - 200 OK: If the started procedures are retrieved successfully.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getMyStartedProcedures = async (req, res) => {
  const clientId = req.user.id;
  try {
    const startedProcedures = await getMyStartedProceduresService(clientId);
    res.status(200).json(startedProcedures);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error al recuperar sus procedimientos iniciados' });
  }
};

/**
 * Creates a task for a procedure.
 *
 * Responds with:
 *   - 201 Created: If the task is created successfully.
 *   - 404 Not Found: If the procedure is not found.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const createProcedureTask = async (req, res) => {
  const { procedureId } = req.params;
  const {
    name,
    description,
    xp,
    role_id,
    estimated_duration_days,
    difficulty,
  } = req.body;
  try {
    const task = await createProcedureTaskService(procedureId, {
      name,
      description,
      xp,
      role_id,
      estimated_duration_days,
      difficulty,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    if (error.message === 'Procedimiento no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al crear la tarea' });
  }
};

/**
 * Retrieves the procedures started by all clients.
 *
 * Responds with:
 *   - 200 OK: If the started procedures are retrieved successfully.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getStartedProcedures = async (req, res) => {
  try {
    const startedProcedures = await getStartedProceduresService();
    res.status(200).json(startedProcedures);
  } catch (error) {
    console.error('Error al recuperar los procedimientos iniciados:', error);
    res
      .status(500)
      .json({ message: 'Error al recuperar los procedimientos iniciados' });
  }
};

/**
 * Retrieves the tasks of a started procedure.
 *
 * Responds with:
 *   - 200 OK: If the tasks are retrieved successfully.
 *   - 404 Not Found: If the started procedure is not found.
 *   - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getStartedProcedureTasks = async (req, res) => {
  const { startedProcedureId } = req.params;
  try {
    const tasks = await getStartedProcedureTasksService(startedProcedureId);
    res.status(200).json(tasks);
  } catch (error) {
    console.error(
      'Error al recuperar las tareas del procedimiento iniciado:',
      error,
    );
    if (error.message === 'Procedimiento iniciado no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    res
      .status(500)
      .json({
        message: 'Error al recuperar las tareas del procedimiento iniciado',
      });
  }
};
