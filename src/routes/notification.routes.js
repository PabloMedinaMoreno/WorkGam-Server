// This file contains the routes for the notifications

import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller.js";
import { authRequired, verifyRole } from "../middlewares/validateToken.js";
import { getEmployeeRolesService } from "../services/role.service.js";

const employeeRoles = await getEmployeeRolesService();


const router = Router();

router.use(authRequired);
router.use(verifyRole([...employeeRoles, "Cliente"])); // Allow access to employees and clients

router.get("/", getNotifications);
router.put("/read/:notificationId", markNotificationAsRead);
router.put("/read", markAllNotificationsAsRead);

export default router;
