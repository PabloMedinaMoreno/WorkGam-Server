// This file contains the routes for the gamification of the users

import { Router } from 'express';
import {
  getEmployeeStatistics,
  getRanking,
  getGamificationLevels,
  getLevelProgression,
} from '../controllers/gamification.controller.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';

const router = Router();

router.use(authRequired);
router.use(verifyRole(['Administrador', 'Empleado'])); // Allow access to admins and employees

// Only employees can access these routes
router.get('/ranking', getRanking);
router.get('/statistics/:employeeId', getEmployeeStatistics);
router.get('/levels', getGamificationLevels);
router.get('/level-progression', getLevelProgression);

export default router;
