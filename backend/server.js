const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Serve the Vite frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// SOCKET.IO setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Your roomUsers, roomBoards, roomChats, and socket logic here
const roomUsers = {};
const roomBoards = {};
const roomChats = {};

io.on("connection", (socket) => {
  socket.on("userJoined", (user) => {
    if (!user.roomId) return;
    const roomId = user.roomId;

    socket.join(roomId);
    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
    roomUsers[roomId].push({ ...user, socketId: socket.id });

    socket.emit("whiteBoardData", roomBoards[roomId] || []);
    socket.emit("roomChatResponse", roomChats[roomId] || []);
    io.to(roomId).emit("roomUsers", roomUsers[roomId]);
  });

  socket.on("whiteBoardData", ({ roomId, elements }) => {
    if (!roomId) return;
    roomBoards[roomId] = elements;
    socket.to(roomId).emit("whiteBoardData", elements);
  });

  socket.on("roomChatMessage", ({ roomId, msg }) => {
    if (!roomId) return;
    if (!roomChats[roomId]) roomChats[roomId] = [];
    roomChats[roomId].push(msg);
    io.to(roomId).emit("roomChatResponse", roomChats[roomId]);
  });

  socket.on("disconnect", () => {
    for (const roomId in roomUsers) {
      const before = roomUsers[roomId].length;
      roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
      if (roomUsers[roomId].length !== before) {
        io.to(roomId).emit("roomUsers", roomUsers[roomId]);
      }
    }
  });
});

// SPA fallback (so refreshing room pages won’t 404)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
