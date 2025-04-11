import {
  signupService,
  loginService,
  logoutService,
  profileService,
  updateProfileService,
  updateProfilePicService,
  changePasswordService,
  forgotPasswordService,
  resetPasswordService,
} from '../services/auth.service.js';
import { createAndSendNotificationService } from '../services/notification.service.js';

/**
 * Registers a new user.
 *
 * Responds with:
 *  - 201 Created: If registration is successful.
 *  - 409 Conflict: If the email already exists.
 *  - 500 Internal Server Error: For general errors.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const signup = async (req, res) => {
  try {
    const { username, email, password, gender, phone } = req.body;
    const { user, token } = await signupService({ username, email, password, gender, phone });

    // Send welcome notification (adjust as needed)
    await createAndSendNotificationService(user.id, '¡Bienvenido a la plataforma!');

    res.cookie('token', token, {
      httpOnly: process.env.NODE_ENV !== 'development',
      secure: true,
      sameSite: 'none',
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.message === 'El email ya existe') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Authenticates a user.
 *
 * Responds with:
 *  - 200 OK: If login is successful.
 *  - 404 Not Found: If the user does not exist.
 *  - 401 Unauthorized: If the password is incorrect.
 *  - 500 Internal Server Error: For general errors.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginService({ email, password });

    res.cookie('token', token, {
      httpOnly: process.env.NODE_ENV !== 'development',
      secure: true,
      sameSite: 'none',
    });

    res.status(200).json(user);
  } catch (error) {
    if (error.message === 'El usuario no existe') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Contraseña inválida') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Logs out a user.
 *
 * Responds with:
 *  - 200 OK: If logout is successful.
 *  - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const logout = async (req, res) => {
  try {
    await logoutService(req);
    res.status(200).json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Retrieves the authenticated user's profile.
 *
 * Responds with:
 *  - 200 OK: If the profile is retrieved successfully.
 *  - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const profile = async (req, res) => {
  try {
    const userProfile = await profileService(req.user.id);
    res.status(200).json(userProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Updates the user's profile.
 *
 * Responds with:
 *  - 200 OK: If the profile is updated successfully.
 *  - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, email, phone } = req.body;
    const updatedProfile = await updateProfileService(req.user.id, { username, email, phone });
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Updates the user's profile picture.
 *
 * Responds with:
 *  - 200 OK: If the profile picture is updated successfully.
 *  - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const updateProfilePic = async (req, res) => {
  try {
    const updatedProfile = await updateProfilePicService(req.user.id, req.file);
    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Changes the user's password.
 *
 * Responds with:
 *  - 200 OK: If the password is changed successfully.
 *  - 400 Bad Request: If the new passwords do not match.
 *  - 404 Not Found: If the user is not found.
 *  - 401 Unauthorized: If the current password is incorrect.
 *  - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const result = await changePasswordService(req.user.id, { oldPassword, newPassword, confirmPassword });
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Las contraseñas no coinciden') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Contraseña actual incorrecta') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Handles the password reset request.
 *
 * Sends a password reset email to the user.
 *
 * Responds with:
 * - 200 OK: If the email is sent successfully.
 * - 400 Bad Request: If the email is not provided or invalid.
 * - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService({ email });
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'El email no existe') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Resets the user's password.
 *
 * Responds with:
 * - 200 OK: If the password is reset successfully.
 * - 400 Bad Request: If the token is invalid or expired.
 * - 500 Internal Server Error: If an error occurs.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const result = await resetPasswordService({ token, password });
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Token inválido o expirado') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

