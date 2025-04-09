import { pool } from "../databases/db.js";

/**
 * Retrieves notifications for a given user.
 *
 * @param {number} personId - The ID of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of notifications.
 * @throws {Error} Throws an error if there is an issue querying the database.
 */
export const getNotificationsService = async (personId) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notification WHERE person_id = $1 ORDER BY created_at DESC",
      [personId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error al obtener las notificaciones en el servicio:", error);
    throw new Error("Error al obtener las notificaciones");
  }
};

/**
 * Marks a specific notification as read.
 *
 * @param {number} notificationId - The ID of the notification to update.
 * @returns {Promise<Object>} A promise that resolves to the updated notification.
 * @throws {Error} Throws an error if the notification is not found or if there is an issue updating it.
 */
export const markNotificationAsReadService = async (notificationId) => {
  try {
    const result = await pool.query(
      "UPDATE notification SET is_read = TRUE WHERE id = $1 RETURNING *",
      [notificationId]
    );
    if (result.rowCount === 0) {
      throw new Error("Notificación no encontrada");
    }
    return result.rows[0];
  } catch (error) {
    console.error(
      "Error al marcar la notificación como leída en el servicio:",
      error
    );
    throw new Error(
      error.message || "Error al marcar la notificación como leída"
    );
  }
};

/**
 * Marks all notifications for a given user as read.
 *
 * @param {number} personId - The ID of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of updated notifications.
 * @throws {Error} Throws an error if there is an issue updating the notifications.
 */
export const markAllNotificationsAsReadService = async (personId) => {
  try {
    const result = await pool.query(
      "UPDATE notification SET is_read = TRUE WHERE person_id = $1 RETURNING *",
      [personId]
    );
    return result.rows;
  } catch (error) {
    console.error(
      "Error al marcar todas las notificaciones como leídas en el servicio:",
      error
    );
    throw new Error("Error al marcar todas las notificaciones como leídas");
  }
};

/**
 * Creates a notification and optionally sends it in real-time using Socket.io.
 * @param {*} personId - The ID of the person receiving the notification.
 * @param {*} message - The message to be sent in the notification.
 * @param {*} io - Socket.io instance for real-time notifications (optional).
 * @param {*} socketId - Socket ID for sending notifications (optional).
 * @returns {Promise<Object>} The created notification.
 */
export const createAndSendNotificationService = async (
  personId,
  message,
  io = null,
  socketId = null
) => {
  const result = await pool.query(
    "INSERT INTO notification (person_id, message) VALUES ($1, $2) RETURNING *",
    [personId, message]
  );
  const notification = result.rows[0];

  // If io and socketId are provided, send the notification in real-time
  await sendWebSocketNotificationService(
    "new_notification",
    notification,
    io,
    socketId
  );

  return notification;
};

/**
 * Sends a level-up notification to an employee and creates a notification in the database.
 * @param {*} employeeId - The ID of the employee.
 * @param {*} currentLevel - The current level of the employee.
 * @param {*} nextLevel - The new level of the employee.
 * @param {*} io - Socket.io instance for real-time notifications.
 * @param {*} socketId - Socket ID for sending notifications.
 */
export const sendLevelUpNotificationService = async (
  employeeId,
  currentLevel,
  nextLevel,
  io,
  socketId
) => {
  // We send a level up event to the employee
  const levelData = {
    previousLevel: {
      name: currentLevel.name,
      xp: currentLevel.pointsRequired,
      image: currentLevel.image,
    },
    nextLevel: {
      name: nextLevel.name,
      xp: nextLevel.pointsRequired,
      image: nextLevel.image,
    },
  };
  // We create a notification for the employee
  await createAndSendNotificationService(
    employeeId,
    `¡Felicidades! Has subido de nivel a ${nextLevel.name}(${nextLevel.pointsRequired} XP)`,
    io,
    socketId
  );
  // We send the level up event to the employee
  await sendWebSocketNotificationService(
    "level_up_notification",
    levelData,
    io,
    socketId
  );
};



/**
 * Sends a WebSocket notification to a specific socket ID.
 * @param {*} notificationType - The type of notification to send.
 * @param {*} notificationData - The data to be sent with the notification.
 * @param {*} io - Socket.io instance for real-time notifications.
 * @param {*} socketId - Socket ID for sending notifications.
 */
export const sendWebSocketNotificationService = async (notificationType, notificationData, io, socketId) => {
  if (io && socketId) {
    io.to(socketId).emit(notificationType, notificationData);
  }
}
