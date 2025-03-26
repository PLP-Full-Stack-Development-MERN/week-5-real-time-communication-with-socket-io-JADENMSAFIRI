const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store notes in memory (in production, use a database)
const notes = {};
const users = {};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);

    // Send current note if it exists
    if (notes[roomId]) {
      socket.emit('noteUpdate', notes[roomId]);
    }

    // Send current users in room
    const roomUsers = io.sockets.adapter.rooms.get(roomId);
    if (roomUsers) {
      socket.emit('roomUsers', Array.from(roomUsers));
    }
  });

  // Update note
  socket.on('updateNote', (roomId, content) => {
    notes[roomId] = content;
    socket.to(roomId).emit('noteUpdate', content);
  });

  // User typing
  socket.on('userTyping', (roomId, userId) => {
    socket.to(roomId).emit('userTyping', userId);
  });

  // User joined room
  socket.on('userJoined', (roomId, userId) => {
    if (!users[roomId]) users[roomId] = new Set();
    users[roomId].add(userId);
    io.to(roomId).emit('userJoined', userId);
  });

  // User left room
  socket.on('userLeft', (roomId, userId) => {
    if (users[roomId]) {
      users[roomId].delete(userId);
      io.to(roomId).emit('userLeft', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
