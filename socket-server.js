#!/usr/bin/env node
/**
 * Standalone Socket.io Server for Real-time Notifications
 * 
 * This server handles real-time communication for the Gram Panchayat Portal.
 * Run this alongside your Next.js app:
 *   node socket-server.js
 * 
 * The server:
 * - Listens for connections from the Next.js frontend
 * - Receives events from API routes (via HTTP calls)
 * - Broadcasts events to connected clients
 * 
 * Environment Variables:
 *   - SOCKET_PORT: Port to run Socket.io server (default: 3001)
 *   - SOCKET_SECRET: Secret key for verifying API requests (default: random)
 *   - NODE_ENV: Set to 'production' for production deployment
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import express from 'express';

const app = express();
const PORT = process.env.SOCKET_PORT || 3001;
const SOCKET_SECRET = process.env.SOCKET_SECRET || 'dev-secret-key-change-in-production';

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware to parse JSON
app.use(express.json());

// Store connected users
const userSockets = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

  // Register user with their socket
  socket.on('register-user', (userId) => {
    if (!userId) return;
    
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    socket.join(`user:${userId}`);
    
    console.log(`[${new Date().toISOString()}] User ${userId} registered (socket: ${socket.id})`);
  });

  // Admin registration
  socket.on('register-admin', (adminId) => {
    if (!adminId) return;
    socket.join('admins');
    socket.join(`admin:${adminId}`);
    console.log(`[${new Date().toISOString()}] Admin ${adminId} registered (socket: ${socket.id})`);
  });

  socket.on('disconnect', () => {
    for (const [userId, sockets] of userSockets.entries()) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
      }
    }
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
  });
});

// HTTP endpoints for API-based event emission
// Verify requests come from the app using the secret

function verifySecret(req, res, next) {
  const secret = req.headers['x-socket-secret'];
  if (secret !== SOCKET_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Emit event to a specific user
app.post('/api/emit-to-user', verifySecret, (req, res) => {
  const { userId, eventName, data } = req.body;
  if (!userId || !eventName) {
    return res.status(400).json({ error: 'Missing userId or eventName' });
  }
  
  io.to(`user:${userId}`).emit(eventName, data);
  console.log(`[${new Date().toISOString()}] Emitted '${eventName}' to user ${userId}`);
  res.json({ success: true });
});

// Emit event to all users
app.post('/api/broadcast-event', verifySecret, (req, res) => {
  const { eventName, data } = req.body;
  if (!eventName) {
    return res.status(400).json({ error: 'Missing eventName' });
  }
  
  io.emit(eventName, data);
  console.log(`[${new Date().toISOString()}] Broadcasted '${eventName}' to all users`);
  res.json({ success: true });
});

// Emit event to admins
app.post('/api/emit-to-admins', verifySecret, (req, res) => {
  const { eventName, data } = req.body;
  if (!eventName) {
    return res.status(400).json({ error: 'Missing eventName' });
  }
  
  io.to('admins').emit(eventName, data);
  console.log(`[${new Date().toISOString()}] Emitted '${eventName}' to all admins`);
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connectedUsers: userSockets.size,
    totalSockets: Object.keys(io.sockets.sockets).length,
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    connectedUsers: userSockets.size,
    totalConnections: Object.keys(io.sockets.sockets).length,
    usersList: Array.from(userSockets.keys()),
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Socket.io server running on port ${PORT}`);
  console.log(`📍 CORS origin: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  console.log('Endpoints:');
  console.log('  POST /api/emit-to-user - Emit to specific user');
  console.log('  POST /api/broadcast-event - Broadcast to all');
  console.log('  POST /api/emit-to-admins - Emit to admin room');
  console.log('  GET /health - Health check');
  console.log('  GET /stats - Connection statistics\n');
});
