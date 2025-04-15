import { Router } from 'express';
import {
  getTasks,
  acceptTask,
  rejectTask,
  getPendingTasks,
  getCompletedTasks,
  deleteTask,
  updateTask,
  uploadTask,
} from '../controllers/task.controller.js';
import {
  updateTaskSchema,
  acceptTaskSchema,
  rejectTaskSchema,
} from '../schemas/task.schema.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';
import { validateSchema } from '../middlewares/validateSchema.js';
import { uploadPDF } from '../middlewares/multer.js';

const router = Router();

router.use(authRequired);

router.post(
  '/:startedProcedureId/:taskId/upload',
  verifyRole(['Cliente']),
  uploadPDF.single('document'),
  uploadTask,
);
router.put(
  '/:taskId',
  verifyRole(['Administrador']),
  validateSchema(updateTaskSchema),
  updateTask,
);
router.delete('/:taskId', verifyRole(['Administrador']), deleteTask);

router.get('/', verifyRole(['Empleado']), getTasks);
router.get('/pending', verifyRole(['Empleado']), getPendingTasks);
router.get('/completed', verifyRole(['Empleado']), getCompletedTasks);

router.put(
  '/accept/:startedTaskId',
  verifyRole(['Empleado']),
  validateSchema(acceptTaskSchema),
  acceptTask,
);
router.put(
  '/reject/:startedTaskId',
  verifyRole(['Empleado']),
  validateSchema(rejectTaskSchema),
  rejectTask,
);

export default router;
