import { Router } from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/role.controller.js';
import { createRoleSchema, updateRoleSchema } from '../schemas/role.schema.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';
import { validateSchema } from '../middlewares/validateSchema.js';

const router = Router();

// Public route to get roles (if desired)
router.get('/', getRoles);

// Protected routes: require authentication and Administrator role
router.use(authRequired);

router.post('/', validateSchema(createRoleSchema), createRole);

router.use(verifyRole(['Administrador']));
router.put('/:roleId', validateSchema(updateRoleSchema), updateRole);
router.delete('/:roleId', deleteRole);

export default router;
