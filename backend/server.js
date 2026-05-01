import http from 'http';
import app from './app.js';
import connectDB from './config/database.js';
import { initializeSocketIO } from './config/socketio.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);
    const io = initializeSocketIO(httpServer);

    // Make io accessible to routes if needed
    app.set('io', io);

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Socket.IO initialized`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();