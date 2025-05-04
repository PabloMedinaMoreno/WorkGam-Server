import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DATABASE_URL , NODE_ENV} from '../constants/constants.js';

const isTest = NODE_ENV === 'test';
const isProd = NODE_ENV === 'production';

export const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  // En test: SSL sí pero sin validar certificado (Railway, etc.)
  // En producción: SSL validado
  // En desarrollo: no SSL
  ssl: isTest
    ? { rejectUnauthorized: false }
    : isProd
      ? { rejectUnauthorized: true }
      : undefined,
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
export async function checkDBConnection() {
  try {
    await pool.connect();
    console.log('>>> Connected to Postgres SQL');
  } catch (error) {
    console.error('XXX Error connecting to Postgres', error);
  }
}

/**
 * Establece el schema de la base de datos (crea la estructura de tablas).
 *
 * @async
 * @returns {Promise<void>} Resuelve cuando se crea la estructura de las tablas.
 * @throws {Error} Si ocurre un error durante la ejecución del SQL.
 */
export async function setupDatabaseSchema() {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('>>> Database schema applied successfully');
  } catch (error) {
    console.error('XXX Error applying database schema:', error);
    throw error;
  }
}

/**
 * Inserta datos en las tablas de la base de datos.
 *
 * @async
 * @returns {Promise<void>} Resuelve cuando se insertan los datos.
 * @throws {Error} Si ocurre un error durante la ejecución del SQL.
 */
async function insertDatabaseData() {
  try {
    console.log('>>> Inserting data into database tables...');
    const dataPath = path.resolve(__dirname, 'data.sql');
    const dataSql = fs.readFileSync(dataPath, 'utf8');
    await pool.query(dataSql);
    console.log('>>> Data inserted successfully');
  } catch (error) {
    console.error('XXX Error inserting data into database:', error);
    throw error;
  }
}

/**
 * Initializes the database by setting up the schema and inserting data.
 *
 * @async
 * @returns {Promise<void>} Resolves when the database is initialized.
 * @throws {Error} If an error occurs during the initialization process.
 * */
export async function initializeDatabase() {
  try {
    await setupDatabaseSchema();
    await insertDatabaseData();
  } catch (error) {
    console.error('XXX Error initializing database:', error);
    throw error;
  }
}
