import { Router } from 'express';
import {
  login,
  signup,
  profile,
  updateProfile,
  updateProfilePic,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';
import { authRequired, verifyRole } from '../middlewares/validateToken.js';
import { uploadProfilePic } from '../middlewares/multer.js';
import { validateSchema } from '../middlewares/validateSchema.js';

const router = Router();

// Public routes
router.post('/login', validateSchema(loginSchema), login);
router.post('/signup', validateSchema(signupSchema), signup);
router.post('/forgot-password', validateSchema(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validateSchema(resetPasswordSchema), resetPassword);

// Protected routes
router.use(authRequired);
router.use(verifyRole(['Administrador', 'Empleado', 'Cliente'])); // Allow access to admins, employees, and clients

router.get('/profile', profile);
router.put('/profile', validateSchema(updateProfileSchema), updateProfile);
router.put(
  '/profile/uploadPic',
  uploadProfilePic.single('profilePic'),
  updateProfilePic,
);
router.put('/changePassword', validateSchema(changePasswordSchema), changePassword);

export default router;
