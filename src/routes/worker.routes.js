import { Router } from "express";
import { getWorkers, createWorker, updateWorker, deleteWorker } from "../controllers/worker.controller.js";
import { createWorkerSchema, updateWorkerSchema } from "../schemas/worker.schema.js";
import { authRequired, verifyRole } from "../middlewares/validateToken.js";
import { validateSchema } from "../middlewares/validateSchema.js";

const router = Router();

// Protected routes: require authentication and Administrator role
router.use(authRequired);
router.use(verifyRole(["Administrador"]));

router.get("/", getWorkers);
router.post("/", validateSchema(createWorkerSchema), createWorker);
router.put("/:workerId", validateSchema(updateWorkerSchema), updateWorker);
router.delete("/:workerId", deleteWorker);

export default router;
