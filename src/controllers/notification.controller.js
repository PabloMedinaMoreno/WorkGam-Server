import {
  getNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
  deleteAllNotificationsService,
} from '../services/notification.service.js';

/**
 * Controller to retrieve notifications for the authenticated user.
 *
 * @param {Object} req - The HTTP request object. Expects req.user.id to contain the user's ID.
 * @param {Object} res - The HTTP response object.
 */
export const getNotifications = async (req, res) => {
  try {
    const personId = req.user.id;
    const notifications = await getNotificationsService(personId);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error in getNotifications controller:', error);
    res.status(500).json({ message: error.message || 'Error al obtener las notificaciones' });
  }
};

/**
 * Controller to mark a specific notification as read.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.notificationId to contain the notification's ID.
 * @param {Object} res - The HTTP response object.
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const updatedNotification = await markNotificationAsReadService(notificationId);
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error in markNotificationAsRead controller:', error);
    if (error.message === 'Notificación no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Error al marcar la notificación como leída' });
  }
};

/**
 * Controller to mark all notifications for the authenticated user as read.
 *
 * @param {Object} req - The HTTP request object. Expects req.user.id to contain the user's ID.
 * @param {Object} res - The HTTP response object.
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const personId = req.user.id;
    const updatedNotifications = await markAllNotificationsAsReadService(personId);
    res.status(200).json(updatedNotifications);
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead controller:', error);
    res.status(500).json({ message: error.message || 'Error al marcar todas las notificaciones como leídas' });
  }
};

/**
 * Controller to delete a specific notification.
 *
 * @param {Object} req - The HTTP request object. Expects req.params.notificationId to contain the notification's ID.
 * @param {Object} res - The HTTP response object.
 */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const deletedNotification = await deleteNotificationService(notificationId);
    res.status(200).json(deletedNotification);
  } catch (error) {
    console.error('Error in deleteNotification controller:', error);
    if (error.message === 'Notificación no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Error al eliminar la notificación' });
  }
};

/**
 * Controller to delete all notifications for the authenticated user.
 *
 * @param {Object} req - The HTTP request object. Expects req.user.id to contain the user's ID.
 * @param {Object} res - The HTTP response object.
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const personId = req.user.id;
    const deletedNotifications = await deleteAllNotificationsService(personId);
    res.status(200).json(deletedNotifications);
  } catch (error) {
    console.error('Error in deleteAllNotifications controller:', error);
    res.status(500).json({ message: error.message || 'Error al eliminar todas las notificaciones' });
  }
};


