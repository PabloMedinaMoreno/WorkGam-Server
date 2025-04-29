// This file contains the routes for the procedures

import { Router } from 'express';
import {
  getProcedures,
  getProcedureTasks,
  createProcedureTask,
  createProcedure,
  updateProcedure,
  deleteProcedure,
  startProcedure,
  getMyStartedProcedures,
  cancelStartedProcedure,
  getStartedProcedures,
  getStartedProcedureTasks,
} from '../controllers/procedure.controller.js';
import {
  createProcedureSchema,
  updateProcedureSchema,
  startProcedureSchema,
  cancelStartedProcedureSchema,
  createProcedureTaskSchema,
} from '../schemas/procedure.schema.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';
import { validateSchema } from '../middlewares/validateSchema.js';
import { getClientStartedTasks, getClientPendingTasks } from '../controllers/task.controller.js';

const router = Router();

router.use(authRequired);

router.get('/', verifyRole(['Empleado', 'Cliente', 'Administrador']), getProcedures);
router.post(
  '/',
  verifyRole(['Administrador']),
  validateSchema(createProcedureSchema),
  createProcedure,
);
router.put(
  '/:procedureId',
  verifyRole(['Administrador']),
  validateSchema(updateProcedureSchema),
  updateProcedure,
);
router.delete('/:procedureId', verifyRole(['Administrador']), deleteProcedure);

router.get(
  '/:procedureId/tasks',
  verifyRole(['Empleado', 'Administrador']),
  getProcedureTasks,
);

router.get('/started/:startedProcedureId/tasks', verifyRole(['Cliente']), getClientStartedTasks);
router.get('/started/:startedProcedureId/tasks/pending', verifyRole(['Cliente']), getClientPendingTasks);


router.post(
  '/:procedureId/tasks',
  verifyRole(['Administrador']),
  validateSchema(createProcedureTaskSchema),
  createProcedureTask,
);

router.get('/started', verifyRole(['Cliente']), getMyStartedProcedures);
router.post(
  '/:procedureId/start',
  verifyRole(['Cliente']),
  validateSchema(startProcedureSchema),
  startProcedure,
);
router.put(
  '/:startedProcedureId/cancel',
  verifyRole(['Cliente', 'Administrador']),
  validateSchema(cancelStartedProcedureSchema),
  cancelStartedProcedure,
);

router.get('/all-started', verifyRole(['Administrador']), getStartedProcedures);
router.get(
  '/all-started/:startedProcedureId/tasks',
  verifyRole(['Administrador']),
  getStartedProcedureTasks,
);

export default router;
