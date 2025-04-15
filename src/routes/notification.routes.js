// This file contains the routes for the notifications

import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notification.controller.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';

const router = Router();

router.use(authRequired);
router.use(verifyRole(['Administrador', 'Empleado', 'Cliente'])); // Allow access to admins, employees, and clients

router.get('/', getNotifications);
router.put('/read/:notificationId', markNotificationAsRead);
router.put('/read', markAllNotificationsAsRead);
router.delete('/:notificationId', deleteNotification);
router.delete('/', deleteAllNotifications);

export default router;
