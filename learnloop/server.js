const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.io event handlers
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join session room
    socket.on('join-session', (data) => {
      const { sessionId, userId, userName, role } = data;
      socket.join(`session-${sessionId}`);
      socket.data.sessionId = sessionId;
      socket.data.userId = userId;
      socket.data.userName = userName;
      socket.data.role = role;

      io.to(`session-${sessionId}`).emit('user-joined', {
        userId,
        userName,
        role,
        socketId: socket.id,
      });

      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // Handle chat messages
    socket.on('send-message', (data) => {
      const { message, sessionId } = data;
      const timestamp = new Date().toISOString();

      io.to(`session-${sessionId}`).emit('receive-message', {
        senderId: socket.data.userId,
        senderName: socket.data.userName,
        message,
        timestamp,
      });
    });

    // Handle whiteboard drawing
    socket.on('draw', (data) => {
      const { sessionId, drawData } = data;
      socket.broadcast.to(`session-${sessionId}`).emit('draw', drawData);
    });

    // Handle whiteboard clear
    socket.on('clear-canvas', (data) => {
      const { sessionId } = data;
      io.to(`session-${sessionId}`).emit('clear-canvas');
    });

    // Handle cursor position for collaborative drawing
    socket.on('cursor-move', (data) => {
      const { sessionId, x, y } = data;
      socket.broadcast.to(`session-${sessionId}`).emit('cursor-move', {
        userId: socket.data.userId,
        x,
        y,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const sessionId = socket.data.sessionId;
      io.to(`session-${sessionId}`).emit('user-left', {
        userId: socket.data.userId,
        userName: socket.data.userName,
      });
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
