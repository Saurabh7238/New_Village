// Socket.io Server Utility
// This utility provides event emission for Socket.io clients
// To use: instantiate and call emitToUser() when events occur

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io = null;
const userSockets = new Map(); // Map of userId -> Set of socket IDs

export function initSocketIOServer(port = 3001) {
  if (io) return io;

  const httpServer = createServer();
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register-user', (userId) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      socket.join(`user:${userId}`);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      for (const [userId, sockets] of userSockets.entries()) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log('User disconnected:', socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`Socket.io server running on port ${port}`);
  });

  return io;
}

export function getIOInstance() {
  if (!io) {
    throw new Error('Socket.io server not initialized. Call initSocketIOServer() first.');
  }
  return io;
}

// Emit event to a specific user
export function emitToUser(userId, eventName, data) {
  if (!io) {
    console.warn('Socket.io not initialized, skipping event emission');
    return;
  }
  io.to(`user:${userId}`).emit(eventName, data);
}

// Emit event to all users (broadcast)
export function broadcastEvent(eventName, data) {
  if (!io) {
    console.warn('Socket.io not initialized, skipping event emission');
    return;
  }
  io.emit(eventName, data);
}

// Emit to admin room
export function emitToAdmins(eventName, data) {
  if (!io) {
    console.warn('Socket.io not initialized, skipping event emission');
    return;
  }
  io.to('admins').emit(eventName, data);
}
