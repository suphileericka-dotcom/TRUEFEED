const { app } = require('./app');
const { env } = require('./config/env');
const { logInfo } = require('./monitoring/logger');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientOrigins.includes('*') ? '*' : env.clientOrigins,
    credentials: true,
  },
});

io.on('connection', (socket) => {
  socket.on('messages:join', (conversationId) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on('messages:send', (message) => {
    if (message?.conversationId) {
      io.to(`conversation:${message.conversationId}`).emit('messages:new', message);
    }
  });

  socket.on('notifications:join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });

  socket.on('stories:join', (storyId) => {
    if (storyId) {
      socket.join(`story:${storyId}`);
    }
  });

  socket.on('stories:leave', (storyId) => {
    if (storyId) {
      socket.leave(`story:${storyId}`);
    }
  });
});

app.set('io', io);

httpServer.listen(env.port, () => {
  logInfo('server_started', {
    app: env.appName,
    port: env.port,
    environment: env.nodeEnv,
  });
});
