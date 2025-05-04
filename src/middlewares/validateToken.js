import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../constants/constants.js';

/**
 * Middleware that verifies if the user is authenticated.
 * It checks if a valid token exists in the browser cookies, decodes it using the secret key,
 * and saves the decoded user in the request object if valid.
 * If the token is invalid or missing, it sends an error message to the user.
 *
 * @param {Object} req - The request object received from the client.
 * @param {Object} res - The response object sent to the client.
 * @param {Function} next - A function that is called when the middleware has finished its work.
 * @returns {void} Calls the next middleware or controller if the token is valid.
 */
export const authRequired = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Se requiere autenticación para acceder a este recurso' });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res
      .status(401)
      .json({ message: 'Formato de Authorization inválido' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }
    req.user = decoded; // { id, role, iat, exp }
    next();
  });
};

/**
 * Middleware that verifies if the user has the necessary role to access the route.
 * This function is used to check if the user's role matches one of the required roles for accessing a route.
 *
 * @param {Array<string>} roles - An array of roles that are allowed to access the route.
 * @returns {Function} A middleware function that checks if the user's role is valid.
 */
export const verifyRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      message:
        'Acceso denegado. No tienes el rol necesario para acceder a este recurso',
    });
  }
  next();
};
