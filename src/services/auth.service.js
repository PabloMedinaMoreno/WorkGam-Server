import bcrypt from "bcryptjs";
import { pool } from "../databases/db.js";
import { createAccessToken } from "../utils/jwt.js";

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
      "SELECT * FROM person WHERE email = $1",
      [email]
    );
    if (emailCheck.rowCount > 0) throw new Error("El email ya existe");

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate the profile picture based on gender
    const profilePic =
      gender === "male"
        ? `https://avatar.iran.liara.run/public/boy?username=${username}`
        : `https://avatar.iran.liara.run/public/girl?username=${username}`;

    // Insert the user into the person table
    const person = await pool.query(
      "INSERT INTO person (username, email, password, profile_pic, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [username, email, hashedPassword, profilePic, phone || null]
    );

    // Insert the user into the client table
    const personId = person.rows[0].id;
    await pool.query("INSERT INTO client (id) VALUES ($1)", [personId]);

    // Create the token
    const token = await createAccessToken({ id: personId, role: "Cliente" });
    const userData = {
      id: personId,
      username,
      email,
      profile_pic: profilePic,
      phone,
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
      [email]
    );

    if (userQuery.rowCount === 0) throw new Error("El usuario no existe");

    const user = userQuery.rows[0];

    // Compare the password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error("Contraseña inválida");

    // Create the token
    const token = await createAccessToken({ id: user.id, role: user.role });
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
 * Logs out a user (clears the cookie).
 *
 * @param {Object} req - The HTTP request object.
 * @throws {Error} Throws an error if an error occurs while logging out.
 */
export const logoutService = async (req) => {
  try {
    // Note: Ensure that the "res" object is also passed if you need to clear the cookie from the service.
    req.res.clearCookie("token");
  } catch (error) {
    throw new Error("Error al cerrar sesión");
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
      [personId]
    );
    return userQuery.rows[0];
  } catch (error) {
    throw new Error("Error al recuperar el perfil");
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
  { username, email, phone }
) => {
  try {
    const result = await pool.query(
      "UPDATE person SET username = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *",
      [username, email, phone || null, personId]
    );
    const user = await profileService(personId);
    return user;
  } catch (error) {
    throw new Error("Error al actualizar el perfil");
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
    const result = await pool.query(
      "UPDATE person SET profile_pic = $1 WHERE id = $2 RETURNING *",
      [profilePic, personId]
    );
    const user = await profileService(personId);
    return user;
  } catch (error) {
    throw new Error("Error al actualizar la foto de perfil");
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
  { oldPassword, newPassword, confirmPassword }
) => {
  try {
    // Check that the new passwords match
    if (newPassword !== confirmPassword)
      throw new Error("Las contraseñas no coinciden");

    // Retrieve the user from the database
    const userQuery = await pool.query(
      "SELECT password FROM person WHERE id = $1",
      [personId]
    );
    if (userQuery.rowCount === 0) throw new Error("Usuario no encontrado");

    const user = userQuery.rows[0];

    // Compare the current password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) throw new Error("Contraseña actual incorrecta");

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    await pool.query("UPDATE person SET password = $1 WHERE id = $2", [
      hashedPassword,
      personId,
    ]);

    return { message: "Contraseña cambiada exitosamente" };
  } catch (error) {
    throw new Error(error.message);
  }
};
