import { pool } from "../databases/db.js";
import { calculateXPGamification } from "../utils/xpUtils.js"; // Utiliza una función para calcular XP y obtener el nivel
import {
  createAndSendNotificationService,
  sendLevelUpNotificationService,
  sendWebSocketNotificationService,
} from "./notification.service.js";
import { gamificationLevels } from "../utils/gamificationLevels.js";
import { profileService } from "./auth.service.js";

/**
 * Gets the ranking of employees.
 * @returns {Promise<Array>} List of employees with their XP and level.
 */
export const getRankingService = async () => {
  const rankingQuery = await pool.query(`
    SELECT 
      p.id AS person_id,
      p.username,
      p.email,
      p.profile_pic,
      r.name AS role,
      g.xp_total
    FROM person p
    JOIN employee e ON p.id = e.id
    JOIN role r ON e.role_id = r.id
    JOIN gamification g ON g.employee_id = e.id
    WHERE r.name != 'Administrador'
    ORDER BY g.xp_total DESC
  `);

  const rankingWithLevels = await Promise.all(
    rankingQuery.rows.map(async (row) => {
      const tasksCompleted = await pool.query(
        "SELECT COUNT(*) AS total FROM started_task WHERE employee_id = $1 AND status = 'completed'",
        [row.person_id]
      );
      const pendingTasks = await pool.query(
        "SELECT COUNT(*) AS total FROM started_task WHERE employee_id = $1 AND status = 'pending'",
        [row.person_id]
      );
      const xp = row.xp_total;
      const level = getUserLevelService(xp);

      return {
        id: row.person_id,
        username: row.username,
        email: row.email,
        profile_pic: row.profile_pic,
        role: row.role,
        xp_total: xp,
        tasks_completed: tasksCompleted.rows[0].total,
        pending_tasks: pendingTasks.rows[0].total,
        level,
      };
    })
  );

  return rankingWithLevels;
};

/**
 * Gets personal statistics of an employee.
 * @param {number} employeeId - Employee ID to fetch statistics.
 * @returns {Promise<Object>} Employee's personal statistics.
 */
export const getEmployeeStatisticsService = async (employeeId) => {
  const statisticsQuery = await pool.query(
    "SELECT xp_total FROM gamification WHERE employee_id = $1",
    [employeeId]
  );

  if (statisticsQuery.rowCount === 0) {
    throw new Error("Statistics not found");
  }

  const tasksCompleted = await pool.query(
    "SELECT COUNT(*) AS total FROM started_task WHERE employee_id = $1 AND status = 'completed'",
    [employeeId]
  );
  const pendingTasks = await pool.query(
    "SELECT COUNT(*) AS total FROM started_task WHERE employee_id = $1 AND status = 'pending'",
    [employeeId]
  );

  const progressData = await getLevelProgressionService(employeeId);

  const user = await profileService(employeeId);

  return {
    user,
    completedTasks: tasksCompleted.rows[0].total,
    pendingTasks: pendingTasks.rows[0].total,
    progressData,
  };
};

/**
 * Gets all the levels in the gamification system.
 * @returns {Array} List of all gamification levels.
 */
export const getGamificationLevelsService = () => {
  return gamificationLevels;
};

/**
 * Updates the employee's XP, checks if their level has changed, and sends notifications.
 * @param {*} employeeId - The ID of the employee.
 * @param {*} taskInfo - The task data for calculating XP.
 * @param {*} io - Socket.io instance for real-time notifications.
 * @param {*} socketId - Socket ID for sending notifications.
 * @param {boolean} isTaskAccepted - Whether the task was accepted or rejected.
 */
export const handleXPAndNotificationService = async (
  employeeId,
  taskInfo,
  startedTaskInfo,
  socketId,
  io,
  isTaskAccepted
) => {
  const {
    name: taskName,
    xp: taskXP,
    estimated_duration_days: estimatedDays,
    difficulty,
  } = taskInfo;
  const { started_date: startedDate, end_date: endDate } = startedTaskInfo;

  // Get current XP of the employee
  const currentXPResult = await pool.query(
    "SELECT xp_total FROM gamification WHERE employee_id = $1",
    [employeeId]
  );
  const currentXP = currentXPResult.rows[0].xp_total;

  if (currentXP === undefined) {
    throw new Error("Current XP not found for the employee");
  }

  // Get current level of the employee
  const currentLevel = getUserLevelService(currentXP);

  // Update XP of the employee
  const newXP = await updateEmployeeXPService(
    employeeId,
    currentXP,
    taskXP,
    estimatedDays,
    difficulty,
    startedDate,
    endDate
  );

  // Check if the level has changed and notify the employee
  const nextLevel = getUserLevelService(newXP);

  const XPChange = newXP - currentXP;

  // Notify the employee about the XP earned
  await createAndSendNotificationService(
    employeeId,
    `Has ${
      isTaskAccepted ? "aceptado" : "rechazado"
    } la tarea "${taskName}" y ganado ${XPChange} XP. Tu XP total es ${newXP}.`,
    io,
    socketId
  );

  // If the level has changed, send a level-up notification
  if (currentLevel.id !== nextLevel.id) {
    await sendLevelUpNotificationService(
      employeeId,
      currentLevel,
      nextLevel,
      io,
      socketId
    );
  } // If the level has not changed, send a progress notification
  else {
    // Considering that each level has 100 XP between them
    const progressData = await getLevelProgressionService(employeeId);
    console.log("Progress Data", progressData);
    await sendWebSocketNotificationService(
      "progress_notification",
      progressData,
      io,
      socketId
    );
  }
};

/**
 * Updates the XP of the employee.
 * @param {*} employeeId - The ID of the employee.
 * @param {*} currentXP - The current XP of the employee.
 * @param {*} taskXP - The XP gained from the task.
 * @param {*} taskDifficulty - The difficulty of the task.
 * @param {*} estimatedDays - The estimated duration of the task.
 * @param {*} startedDate - The start date of the task.
 * @param {*} endDate - The end date of the task.
 * @returns {Promise<number>} The updated XP of the employee.
 *
 */
export const updateEmployeeXPService = async (
  employeeId,
  currentXP,
  taskXP,
  estimatedDays,
  taskDifficulty,
  startedDate,
  endDate
) => {
  const newXP =
    currentXP +
    calculateXPGamification(
      taskXP,
      estimatedDays,
      taskDifficulty,
      startedDate,
      endDate
    );
  await pool.query(
    "UPDATE gamification SET xp_total = $1 WHERE employee_id = $2",
    [newXP, employeeId]
  );

  return newXP;
};

/**
 * This function returns the level of the user based on the XP
 * @param {*} userXP - The XP of the user
 * @returns The level of the user
 */
export const getUserLevelService = (userXP) => {
  return gamificationLevels
    .filter((level) => userXP >= level.pointsRequired)
    .slice(-1)[0]; // We get the last level that the user has reached
};

/**
 * This function returns the level progression of the user
 * @param {*} employeeId - The ID of the employee
 * @returns The level progression of the user
 */
export const getLevelProgressionService = async (employeeId) => {
  const currentXPResult = await pool.query(
    "SELECT xp_total FROM gamification WHERE employee_id = $1",
    [employeeId]
  );

  const currentXP = currentXPResult.rows[0].xp_total;
  const currentLevel = getUserLevelService(currentXP);
  let nextLevel = gamificationLevels.find(
    (level) => level.id === currentLevel.id + 1
  );

  if (!nextLevel) {
    nextLevel = {
      currentLevel: "Max Level",
      xp: "∞",
      image: "https://sonhoastral.com/uploads/content/image/96371/infinito.jpg",
    };
  }
  const progressData = {
    currentLevel: {
      name: currentLevel.name,
      xp: currentLevel.pointsRequired,
      image: currentLevel.image,
    },
    nextLevel: {
      name: nextLevel.name,
      xp: nextLevel.pointsRequired,
      image: nextLevel.image,
    },
    currentXP: currentXP,
  };

  return progressData;
};
