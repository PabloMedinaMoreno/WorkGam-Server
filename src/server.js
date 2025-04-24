// This is the main file of the backend.
// It creates the server and the socket.io instance, and sets up the configuration for the socket.io server.
// It also defines the configuration for the socket.io server, allowing connections only from the frontend URL and enabling the use of GET, POST, PUT, and DELETE methods.
// Finally, it exports the server and the socket.io instance to be used in other files.

import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { FRONTEND_URL } from './constants/constants.js';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// We set the socket.io instance in the app.locals to be used in the controllers
app.locals.io = io;

export { server, io };
