import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../databases/db.js';
import { JWT_SECRET, FRONTEND_URL } from '../constants/constants.js';
import { sendEmail } from '../utils/sendEmail.utils.js';
import { loadTemplate } from '../utils/templateLoader.utils.js';
import { createAccessToken } from '../utils/jwt.utils.js';

/**
 * Registers a new user.
 *
 * @param {Object} data - The user data.
 * @param {string} data.username - The username.
 * @param {string} data.email - The email address.
 * @param {string} data.password - The password.
 * @param {string} data.gender - The gender ("male" or "female").
 * @param {string} [data.phone] - The phone number (optional).
 * @returns {Promise<Object>} An object containing the token and user data.
 * @throws {Error} Throws an error if the email already exists or if an error occurs during the process.
 */
export const signupService = async ({
  username,
  email,
  password,
  gender,
  phone,
}) => {
  try {
    // Check if the email already exists
    const emailCheck = await pool.query(
      'SELECT * FROM person WHERE email = $1',
      [email],
    );
    if (emailCheck.rowCount > 0) {
      throw new Error('El email ya está registrado');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate the profile picture based on gender
    const profilePic =
      gender === 'male'
        ? `https://avatar.iran.liara.run/public/boy?username=${username}`
        : `https://avatar.iran.liara.run/public/girl?username=${username}`;

    // Insert the user into the person table
    const person = await pool.query(
      'INSERT INTO person (username, email, password, profile_pic, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, hashedPassword, profilePic, phone || null],
    );

    // Insert the user into the client table
    const personId = person.rows[0].id;
    await pool.query('INSERT INTO client (id) VALUES ($1)', [personId]);

    // Enviar email de bienvenida
    const htmlContent = loadTemplate('welcomeEmail.html', {
      USERNAME: username,
    });
    await sendEmail(email, 'Bienvenido a WorkGam', htmlContent);

    // Create the token
    const token = await createAccessToken({ id: personId, role: 'Cliente' });
    const userData = {
      id: personId,
      username,
      email,
      profile_pic: profilePic,
      phone,
      role: 'Cliente',
    };

    return { token, user: userData };
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Authenticates a user.
 *
 * @param {Object} data - The authentication data.
 * @param {string} data.email - The email address.
 * @param {string} data.password - The password.
 * @returns {Promise<Object>} An object containing the token and user data.
 * @throws {Error} Throws an error if the user does not exist or if the password is incorrect.
 */
export const loginService = async ({ email, password }) => {
  try {
    const userQuery = await pool.query(
      `SELECT p.id, p.username, p.email, p.password, p.profile_pic, p.phone, 
              COALESCE(e.role_id, NULL) AS role_id, 
              COALESCE(r.name, 'Cliente') AS role
       FROM person p
       LEFT JOIN employee e ON p.id = e.id
       LEFT JOIN role r ON e.role_id = r.id
       WHERE p.email = $1`,
      [email],
    );

    if (userQuery.rowCount === 0) {
      throw new Error('El usuario no existe');
    }

    const user = userQuery.rows[0];

    // Compare the password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error('Contraseña inválida');
    }

    // Create the token
    const token = await createAccessToken({
      id: user.id,
      role:
        user.role === 'Administrador'
          ? 'Administrador'
          : user.role === 'Cliente'
            ? 'Cliente'
            : 'Empleado',
    });
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile_pic: user.profile_pic,
      phone: user.phone,
    };

    return {
      user: userData,
      token,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};


/**
 * Retrieves the profile of a user.
 *
 * @param {number|string} personId - The ID of the user.
 * @returns {Promise<Object>} The user's profile data.
 * @throws {Error} Throws an error if an error occurs while retrieving the profile.
 */
export const profileService = async (personId) => {
  try {
    const userQuery = await pool.query(
      `SELECT p.id, p.username, p.email, p.profile_pic, p.phone,
              COALESCE(e.role_id, NULL) AS role_id,
              COALESCE(r.name, 'Cliente') AS role
       FROM person p
       LEFT JOIN employee e ON p.id = e.id
       LEFT JOIN role r ON e.role_id = r.id
       WHERE p.id = $1`,
      [personId],
    );
    return userQuery.rows[0];
  } catch (error) {
    throw new Error(error.message || 'Error al obtener el perfil');
  }
};

/**
 * Updates the profile of a user.
 *
 * @param {number|string} personId - The ID of the user.
 * @param {Object} data - The profile data to update.
 * @param {string} data.username - The new username.
 * @param {string} data.email - The new email address.
 * @param {string} [data.phone] - The new phone number.
 * @returns {Promise<Object>} The updated profile data.
 * @throws {Error} Throws an error if an error occurs while updating the profile.
 */
export const updateProfileService = async (
  personId,
  { username, email, phone },
) => {
  try {

    // Check if the email already exists for another user
    const emailCheck = await pool.query(
      'SELECT * FROM person WHERE email = $1 AND id != $2',
      [email, personId],
    );
    if (emailCheck.rowCount > 0) {
      throw new Error('El email ya está registrado');
    }

    await pool.query(
      'UPDATE person SET username = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [username, email, phone || null, personId],
    );
    const user = await profileService(personId);
    return user;
  } catch (error) {
    throw new Error(error.message || 'Error al actualizar el perfil');
  }
};

/**
 * Updates the profile picture of a user.
 *
 * @param {number|string} personId - The ID of the user.
 * @param {Object} file - The file object containing the new profile picture.
 * @returns {Promise<Object>} An object containing the new profile picture URL.
 * @throws {Error} Throws an error if an error occurs while updating the profile picture.
 */
export const updateProfilePicService = async (personId, file) => {
  try {
    const profilePic = file.location;
    await pool.query(
      'UPDATE person SET profile_pic = $1 WHERE id = $2 RETURNING *',
      [profilePic, personId],
    );
    const user = await profileService(personId);
    return user;
  } catch (error) {
    throw new Error(error.message || 'Error al actualizar la foto de perfil');
  }
};

/**
 * Changes the user's password.
 *
 * @param {number|string} personId - The ID of the user.
 * @param {Object} passwords - The password data.
 * @param {string} passwords.oldPassword - The current password.
 * @param {string} passwords.newPassword - The new password.
 * @param {string} passwords.confirmPassword - The confirmation of the new password.
 * @returns {Promise<Object>} An object with a success message.
 * @throws {Error} Throws an error if the passwords do not match, the user is not found, or the current password is incorrect.
 */
export const changePasswordService = async (
  personId,
  { oldPassword, newPassword, confirmPassword },
) => {
  try {
    // Check that the new passwords match
    if (newPassword !== confirmPassword) {
      console.log('Las contraseñas no coinciden');
      throw new Error('Las contraseñas no coinciden');
    }

    // Retrieve the user from the database
    const userQuery = await pool.query(
      'SELECT password FROM person WHERE id = $1',
      [personId],
    );
    if (userQuery.rowCount === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = userQuery.rows[0];

    // Compare the current password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await pool.query('UPDATE person SET password = $1 WHERE id = $2', [
      hashedPassword,
      personId,
    ]);

    return { message: 'Contraseña cambiada exitosamente' };
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Service to send the password recovery email.
 *
 * Looks up the user by email, generates a reset token with a 1-hour expiration,
 * loads a professional HTML email template located at src/templates/resetPasswordEmail.html,
 * and sends the email.
 *
 * @param {Object} param0 - An object containing the email.
 * @param {string} param0.email - The user's email address.
 * @returns {Promise<Object>} A Promise that resolves with a success message.
 * @throws {Error} If the user does not exist.
 */
export async function forgotPasswordService({ email }) {
  // Look up the user in the person table
  const userQuery = await pool.query(
    'SELECT id, email FROM person WHERE email = $1',
    [email],
  );

  if (userQuery.rowCount === 0) {
    throw new Error('El email no está registrado');
  }

  const user = userQuery.rows[0];

  // Generate a reset token with a 1-hour expiration
  const token = await createAccessToken({ id: user.id }, '1h');

  // Build the reset link using the FRONTEND_URL from configuration
  const resetLink = `${FRONTEND_URL}/reset-password/${token}`;

  // Load the email template and replace the placeholder {{RESET_LINK}}
  const htmlContent = loadTemplate('resetPasswordEmail.html', {
    RESET_LINK: resetLink,
  });

  // Send the email with the template
  await sendEmail(user.email, 'Restablecer contraseña', htmlContent);

  return { message: 'El enlace para restablecer tu contraseña ha sido enviado', token };
}

/**
 * Service to reset the password.
 *
 * Verifies the provided token and, if valid, hashes the new password and updates it in the database.
 *
 * @param {Object} param0 - An object containing the reset token and new password.
 * @param {string} param0.token - The JWT token received via email.
 * @param {string} param0.password - The new password.
 * @returns {Promise<Object>} A Promise that resolves with a success message.
 * @throws {Error} If the token is invalid or expired.
 */
export async function resetPasswordService({ token, password }) {
  let payload;
  try {
    // Verify the token; if invalid or expired, an error will be thrown
    payload = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Error al verificar el token:', error);
    throw new Error('Token inválido o expirado');
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the password in the person table using the id from the token payload
  await pool.query('UPDATE person SET password = $1 WHERE id = $2', [
    hashedPassword,
    payload.id,
  ]);

  return { message: 'La contraseña ha sido actualizada exitosamente' };
}
