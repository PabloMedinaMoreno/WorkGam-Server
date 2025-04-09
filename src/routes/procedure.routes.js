// This file contains the routes for the procedures

import { Router } from "express";
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
} from "../controllers/procedure.controller.js";
import {
  createProcedureSchema,
  updateProcedureSchema,
  startProcedureSchema,
  cancelStartedProcedureSchema,
  createProcedureTaskSchema,
} from "../schemas/procedure.schema.js";
import { authRequired, verifyRole } from "../middlewares/validateToken.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { getEmployeeRolesService } from "../services/role.service.js";

const employeeRoles = await getEmployeeRolesService();

const router = Router();

router.use(authRequired);

router.get("/", verifyRole([...employeeRoles, "Cliente"]), getProcedures);
router.post(
  "/",
  verifyRole(["Administrador"]),
  validateSchema(createProcedureSchema),
  createProcedure
);
router.put(
  "/:procedureId",
  verifyRole(["Administrador"]),
  validateSchema(updateProcedureSchema),
  updateProcedure
);
router.delete("/:procedureId", verifyRole(["Administrador"]), deleteProcedure);

router.get(
  "/:procedureId/tasks",
  verifyRole([...employeeRoles, "Cliente"]),
  getProcedureTasks
);
router.post(
  "/:procedureId/tasks",
  verifyRole(["Administrador"]),
  validateSchema(createProcedureTaskSchema),
  createProcedureTask
);

router.get("/started", verifyRole(["Cliente"]), getMyStartedProcedures);
router.post(
  "/:procedureId/start",
  verifyRole(["Cliente"]),
  validateSchema(startProcedureSchema),
  startProcedure
);
router.put(
  "/:startedProcedureId/cancel",
  verifyRole(["Cliente"]),
  validateSchema(cancelStartedProcedureSchema),
  cancelStartedProcedure
);

router.get("/all-started", verifyRole(["Administrador"]), getStartedProcedures);
router.get(
  "/started/:startedProcedureId/tasks",
  verifyRole(["Administrador"]),
  getStartedProcedureTasks
);

export default router;
