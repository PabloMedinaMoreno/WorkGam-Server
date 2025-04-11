import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

/**
 * Creates a JWT token with a customizable expiration.
 * @param {Object} payload - The payload to sign.
 * @param {string} expiresIn - Expiration time (default "1d").
 * @returns {Promise<string>} The generated token.
 */
export function createAccessToken(payload, expiresIn = '1d') {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn }, // Usa el valor recibido como parámetro
      (err, token) => {
        if (err) {reject(err);}
        resolve(token);
      },
    );
  });
}
