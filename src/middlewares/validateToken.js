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
  const { token } = req.cookies; // We get the token from the cookies of the request, its name is 'token'

  // If there is no token, send an error message
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // If there is a token, verify it with the secret key
  jwt.verify(token, JWT_SECRET, (error, decoded) => {
    // If the token is not valid, send an error message
    if (error) {return res.status(403).json({ message: 'Invalid token' });}

    // If the token is valid, save the decoded user in the request object
    req.user = decoded;

    next(); // Proceed to the next middleware or controller
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
  // If the user's role is not one of the allowed roles, send an error message
  if (!roles.includes(req.user.role)) {
    console.log('User role:', req.user.role);
    console.log('Required roles:', roles);
    return res
      .status(403)
      .json({
        message: 'Access denied, insufficient permissions',
      });
  }

  next(); // Proceed to the next middleware or controller if the role matches
};
