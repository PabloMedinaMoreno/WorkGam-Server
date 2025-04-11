// This file contains the routes for the gamification of the users

import { Router } from 'express';
import {
  getEmployeeStatistics,
  getRanking,
  getGamificationLevels,
  getLevelProgression,
} from '../controllers/gamification.controller.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';
import { getEmployeeRolesService } from '../services/role.service.js';

const employeeRoles = await getEmployeeRolesService();

const router = Router();

router.use(authRequired);

// Only employees can access these routes
router.get('/ranking', verifyRole(employeeRoles), getRanking);
router.get('/statistics/:employeeId', verifyRole(employeeRoles), getEmployeeStatistics);
router.get('/levels', verifyRole(employeeRoles), getGamificationLevels);
router.get('/level-progression', verifyRole(employeeRoles), getLevelProgression);

export default router;
