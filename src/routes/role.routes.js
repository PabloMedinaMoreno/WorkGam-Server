import { Router } from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/role.controller.js';
import { createRoleSchema, updateRoleSchema } from '../schemas/role.schema.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';
import { validateSchema } from '../middlewares/validateSchema.js';

const router = Router();

// Protected routes: require authentication and Administrator role
router.use(authRequired);

router.get('/', verifyRole(['Administrador', 'Empleado', 'Cliente']), getRoles);

router.use(verifyRole(['Administrador']));
router.post('/', validateSchema(createRoleSchema), createRole);
router.put('/:roleId', validateSchema(updateRoleSchema), updateRole);
router.delete('/:roleId', deleteRole);

export default router;
