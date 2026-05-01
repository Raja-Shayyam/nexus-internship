import { Server } from 'socket.io';
import logger from '../utils/logger.js';

export const initializeSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('join-room', (data) => {
      socket.join(data.roomId);
      logger.info(`User ${data.userId} joined room ${data.roomId}`);
      socket.to(data.roomId).emit('user-joined', {
        userId: data.userId,
        socketId: socket.id,
      });
    });

    socket.on('send-offer', (data) => {
      socket.to(data.targetSocketId).emit('receive-offer', {
        offer: data.offer,
        senderSocketId: socket.id,
      });
      logger.debug(`Offer sent from ${socket.id} to ${data.targetSocketId}`);
    });

    socket.on('send-answer', (data) => {
      socket.to(data.targetSocketId).emit('receive-answer', {
        answer: data.answer,
        senderSocketId: socket.id,
      });
      logger.debug(`Answer sent from ${socket.id} to ${data.targetSocketId}`);
    });

    socket.on('send-ice-candidate', (data) => {
      socket.to(data.targetSocketId).emit('receive-ice-candidate', {
        candidate: data.candidate,
        senderSocketId: socket.id,
      });
    });

    socket.on('call-ended', (data) => {
      socket.to(data.roomId).emit('call-ended', {
        userId: data.userId,
      });
      logger.info(`Call ended in room ${data.roomId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
      socket.broadcast.emit('user-disconnected', { socketId: socket.id });
    });
  });

  return io;
};