import jwt from "jsonwebtoken"; 
import { JWT_SECRET } from "../config/config.js"; 

/**
 * This function creates an access token using the payload
 * @param {*} payload - The payload to sign the token
 * @returns The access token
 */
export function createAccessToken(payload) {
  return new Promise((resolve, reject) => {
    // JWT is used to create the token and sign it
    jwt.sign(
      payload,
      JWT_SECRET, // We sign the token with the secret key
      {
        expiresIn: "1d", // The token expires in 1 day
      },
      (err, token) => {
        if (err) reject(err); // If there is an error, the promise is rejected with the error
        resolve(token); // If the token is signed correctly, the promise is resolved with the token
      }
    );
  });
}
