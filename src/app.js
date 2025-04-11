// This file is the entry point of the backend application.
// It imports the necessary modules and sets up the middlewares and routes.

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Import the routes
import authRoutes from './routes/auth.routes.js';
import roleRoutes from './routes/role.routes.js';
import workerRoutes from './routes/worker.routes.js';
import procedureRoutes from './routes/procedure.routes.js';
import taskRoutes from './routes/task.routes.js';
import gamificationRoutes from './routes/gamification.routes.js';
import notificationRoutes from './routes/notification.routes.js';

// Importa the frontend URL
import { FRONTEND_URL } from './config/config.js';

const app = express();

// Middlewares
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);

export default app;
