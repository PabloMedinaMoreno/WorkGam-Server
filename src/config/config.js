// This file contains all the configuration variables for the backend server
// It includes the port, the database connection, the JWT secret and the AWS credentials

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV;

export const PORT = process.env.PORT;
export const BACKEND_URL = process.env.BACKEND_URL;
export const FRONTEND_URL = process.env.FRONTEND_URL;
export const JWT_SECRET = process.env.JWT_SECRET;

export const DB_PORT = process.env.DB_PORT;
export const DB_USER = process.env.DB_USER;
export const DB_HOST = process.env.DB_HOST;
export const DB_DATABASE = process.env.DB_DATABASE;
export const DB_PASSWORD = process.env.DB_PASSWORD;

export const AWS_REGION = process.env.AWS_REGION;
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

export const DATABASE_URL = process.env.DATABASE_URL;
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

export const EMAIL_FROM = process.env.EMAIL_FROM;
export const EMAIL_PASS = process.env.EMAIL_PASS;
