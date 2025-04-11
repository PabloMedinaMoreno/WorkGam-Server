import {
  getGamificationLevelsService,
  getRankingService,
  getEmployeeStatisticsService,
  getLevelProgressionService,
} from '../services/gamification.service.js';

/**
 * Retrieves the ranking of employees.
 *
 * Responds with:
 *   - 200 OK: If the ranking is retrieved successfully.
 *   - 500 Internal Server Error: If an error occurs while retrieving the ranking.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getRanking = async (req, res) => {
  try {
    const ranking = await getRankingService();
    res.status(200).json(ranking);
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    res.status(500).json({ message: 'Error al obtener el ranking' });
  }
};

/**
 * Retrieves the personal statistics of an employee.
 *
 * Responds with:
 *   - 200 OK: If the statistics are retrieved successfully.
 *   - 500 Internal Server Error: If an error occurs while retrieving the statistics.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getEmployeeStatistics = async (req, res) => {
  const { employeeId } = req.params; // Use the ID from the request params or the authenticated user
  try {
    const statistics = await getEmployeeStatisticsService(employeeId);
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error al obtener las estadísticas personales:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener las estadísticas personales' });
  }
};

/**
 * Retrieves the gamification levels.
 *
 * Responds with:
 *   - 200 OK: If the levels are retrieved successfully.
 *   - 500 Internal Server Error: If an error occurs while retrieving the levels.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const getGamificationLevels = (req, res) => {
  try {
    const levels = getGamificationLevelsService();
    res.status(200).json(levels);
  } catch (error) {
    console.error('Error al obtener los niveles:', error);
    res.status(500).json({ message: 'Error al obtener los niveles' });
  }
};

/**
 * Retrieves the level progression of an employee.
 *
 * Responds with:
 *  - 200 OK: If the level progression is retrieved successfully.
 * - 500 Internal Server Error: If an error occurs while retrieving the level progression.
 *
 * @param {*} req - The HTTP request object.
 * @param {*} res - The HTTP response object.
 */
export const getLevelProgression = async (req, res) => {
  try {
    const levelProgression = await getLevelProgressionService(req.user.id);
    res.status(200).json(levelProgression);
  } catch (error) {
    console.error('Error al obtener la progresión de nivel:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener la progresión de nivel' });
  }
};
