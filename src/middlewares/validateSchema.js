/**
 * Middleware used to validate the request body against a given schema.
 * This middleware ensures that the data in the request body adheres to the defined structure and rules specified in the schema.
 * If the request body is valid, it calls the next middleware. If invalid, it responds with a 400 error and the validation message.
 * 
 * @param {Object} schema - The schema to validate the request body against. 
 *                           The schema should have a `parseAsync` method for asynchronous validation.
 * 
 * @returns {Function} - The middleware function that validates the request body.
 * @throws {Error} If validation fails, a 400 error with the validation message is returned to the client.
 */
export const validateSchema = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body); // Validate the request body using the provided schema
    next(); // If the object is valid, call the next middleware
  } catch (error) {
    // If the validation fails, send a 400 response with the error message
    console.error("Validation error:", error.errors[0].message); // Log the validation error
    res.status(400).json({ message: error.errors[0].message });
  }
};
