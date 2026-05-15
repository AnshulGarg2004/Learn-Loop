const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
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
      origin: [
        process.env.FRONTEND_URL,
      ],
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Random Video Matching Logic
  const waitingList = [];
  const activePairs = new Map();

  // Socket.io event handlers
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- Random Video Matching ---
    socket.on("start-matching", () => {
      if (waitingList.includes(socket.id)) return;

      if (waitingList.length > 0) {
        const partner = waitingList.shift();
        const randomRoomId = `random-${Math.random().toString(36).substring(7)}`;

        activePairs.set(socket.id, partner);
        activePairs.set(partner, socket.id);

        socket.emit("matched", { roomId: randomRoomId });
        io.to(partner).emit("matched", { roomId: randomRoomId });
      } else {
        waitingList.push(socket.id);
        socket.emit('waiting');
      }
    });

    socket.on("next-match", () => {
      handleLeaveMatch(socket.id);
    });

    function handleLeaveMatch(id) {
      const index = waitingList.indexOf(id);
      if (index !== -1) waitingList.splice(index, 1);

      const partner = activePairs.get(id);
      if (partner) {
        io.to(partner).emit("partnerLeft");
        activePairs.delete(partner);
        activePairs.delete(id);
      }
    }
    // ----------------------------

    // Register user for personal notifications
    socket.on('register-user', (userId) => {
      socket.join(`user-${userId}`);
      socket.data.userId = userId;
      console.log(`[SOCKET] User ${userId} registered in room: user-${userId}`);
    });

    // Handle tutor accepting a request
    socket.on('tutor-accepted', (data) => {
      const { studentId, sessionId, tutorName } = data;
      console.log(`[SOCKET] Tutor ${tutorName} accepted session ${sessionId} for student ${studentId}`);

      const roomName = `user-${studentId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      const numClients = room ? room.size : 0;
      console.log(`[SOCKET] Notifying room ${roomName} (${numClients} clients)`);

      io.to(roomName).emit('request-accepted', {
        sessionId,
        tutorName
      });
    });

    // Join session room
    socket.on('join-session', (data) => {
      const { sessionId, userId, userName, role } = data;
      socket.join(`session-${sessionId}`);
      socket.join(`user-${userId}`); // Join personal room for notifications
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
      const senderId = socket.data.userId;
      const senderName = socket.data.userName;

      io.to(`session-${sessionId}`).emit('receive-message', {
        senderId,
        senderName,
        message,
        timestamp,
      });

      // Save to database asynchronously
      fetch(`http://${hostname}:${port}/api/session/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, senderName, message, timestamp })
      }).catch(err => console.error('[SOCKET] Failed to save message:', err));
    });

    // Handle resource sharing
    socket.on('share-resource', (data) => {
      const { sessionId, resourceType, fileUrl, title, userId } = data;
      const timestamp = new Date().toISOString();
      const uploadedBy = socket.data.userId || userId;

      io.to(`session-${sessionId}`).emit('receive-resource', {
        uploadedBy,
        resourceType,
        fileUrl,
        title,
        uploadedAt: timestamp,
      });

      // Save to database asynchronously
      fetch(`http://${hostname}:${port}/api/session/${sessionId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadedBy, resourceType, fileUrl, title, timestamp })
      }).catch(err => console.error('[SOCKET] Failed to save resource:', err));
    });

    // Handle whiteboard drawing
    socket.on('draw', (data) => {
      const { sessionId, drawData } = data;
      console.log(`[WHITEBOARD] Draw sync from ${socket.id} for session ${sessionId}`);
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
        userName: socket.data.userName
      });
    });

    // Handle session end
    socket.on('end-session', (data) => {
      const { sessionId } = data;
      io.to(`session-${sessionId}`).emit('session-ended');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      handleLeaveMatch(socket.id);
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
