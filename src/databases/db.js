import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  DB_USER,
  DB_HOST,
  DB_DATABASE,
  DB_PASSWORD,
  DB_PORT,
} from "../config/config.js";

// Create a new pool to connect to the database
// This pool is used to interact with the database
// export const pool = new pg.Pool({
//   user: DB_USER,
//   host: DB_HOST,
//   database: DB_DATABASE,
//   password: DB_PASSWORD,
//   port: DB_PORT,
// });

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Connects to the Postgres database using the pool configuration.
 * Logs a success message if the connection is successful.
 * If an error occurs during the connection, logs the error message.
 *
 * @async
 * @returns {Promise<void>} Resolves if the connection is successful.
 * @throws {Error} If an error occurs while connecting to the database.
 */
export async function connectDB() {
  try {
    await pool.connect();
    console.log(">>> Connected to Postgres SQL");
  } catch (error) {
    console.error("XXX Error connecting to Postgres", error);
  }
}

/**
 * Sets up the database schema by reading the `schema.sql` and `data.sql` files,
 * replacing the placeholder with the actual database name, and then executing
 * the SQL commands to create tables and indexes.
 *
 * @async
 * @returns {Promise<void>} Resolves when the schema setup is completed successfully.
 * @throws {Error} If an error occurs during the execution of the schema SQL.
 */
export async function setupDatabase() {
  try {
    console.log(`>>> Checking and setting up database`);
    // Read the schema.sql file and replace the placeholder with the database name
    const schemaPath = path.resolve(__dirname, "schema.sql");
    const dataPath = path.resolve(__dirname, "data.sql");
    let schema = fs.readFileSync(schemaPath, "utf8");
    const data = fs.readFileSync(dataPath, "utf8");

    // Execute the schema.sql file
    // This creates the tables and indexes in the database
    await pool.query(schema);
    await pool.query(data);
    console.log(">>> Database schema applied successfully");
  } catch (error) {
    console.error("XXX Error executing schema.sql", error);
  }
}
