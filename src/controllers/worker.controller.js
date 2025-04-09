import {
  createWorkerService,
  getWorkersService,
  updateWorkerService,
  deleteWorkerService,
} from "../services/worker.service.js";

/**
 * Creates a new worker.
 *
 * Responds with:
 *  - 201 Created: If the worker is created successfully.
 *  - 500 Internal Server Error: If an error occurs during worker creation.
 *
 * @param {Object} req - The HTTP request object. Expects worker data in req.body.
 * @param {Object} res - The HTTP response object.
 */
export const createWorker = async (req, res) => {
  try {
    const { username, email, password, gender, phone, role_id } = req.body;
    const worker = await createWorkerService({ username, email, password, gender, phone, role_id });
    res.status(201).json(worker);
  } catch (error) {
    console.error("Error al crear el trabajador:", error);
    res.status(500).json({ message: error.message || "Error al crear el trabajador" });
  }
};

/**
 * Retrieves all workers.
 *
 * Responds with:
 *  - 200 OK: If workers are retrieved successfully.
 *  - 500 Internal Server Error: If an error occurs while retrieving workers.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getWorkers = async (req, res) => {
  try {
    const workers = await getWorkersService();
    res.status(200).json(workers);
  } catch (error) {
    console.error("Error al obtener los trabajadores:", error);
    res.status(500).json({ message: error.message || "Error al obtener los trabajadores" });
  }
};

/**
 * Updates an existing worker's information.
 *
 * Responds with:
 *  - 200 OK: If the worker is updated successfully.
 *  - 500 Internal Server Error: If an error occurs while updating the worker.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.workerId and worker data in req.body.
 * @param {Object} res - The HTTP response object.
 */
export const updateWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { username, email, role_id, phone } = req.body;
    const worker = await updateWorkerService(workerId, { username, email, role_id, phone });
    res.status(200).json(worker);
  } catch (error) {
    console.error("Error al actualizar el trabajador:", error);
    res.status(500).json({ message: error.message || "Error al actualizar el trabajador" });
  }
};

/**
 * Deletes a worker.
 *
 * Responds with:
 *  - 204 No Content: If the worker is deleted successfully.
 *  - 500 Internal Server Error: If an error occurs while deleting the worker.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.workerId.
 * @param {Object} res - The HTTP response object.
 */
export const deleteWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    await deleteWorkerService(workerId);
    res.status(204).json({ message: "Trabajador eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el trabajador:", error);
    res.status(500).json({ message: error.message || "Error al eliminar el trabajador" });
  }
};
