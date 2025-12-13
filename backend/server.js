const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const roomUsers = {};   
const roomBoards = {};  
const roomChats = {};  



io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("userJoined", (user) => {
    const { roomId } = user;
    if (!roomId) return;

    socket.join(roomId);

    if (!roomUsers[roomId]) roomUsers[roomId] = [];

    roomUsers[roomId] = roomUsers[roomId].filter(
      (u) => u.socketId !== socket.id
    );

    roomUsers[roomId].push({ ...user, socketId: socket.id });

    socket.emit("whiteBoardData", roomBoards[roomId] || []);

    socket.emit("roomChatResponse", roomChats[roomId] || []);

   
    io.to(roomId).emit("roomUsers", roomUsers[roomId]);

    console.log(`User joined room ${roomId} | Users: ${roomUsers[roomId].length}`);
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

      roomUsers[roomId] = roomUsers[roomId].filter(
        (u) => u.socketId !== socket.id
      );

      if (roomUsers[roomId].length !== before) {
        io.to(roomId).emit("roomUsers", roomUsers[roomId]);
        console.log(
          `User left room ${roomId} | Users: ${roomUsers[roomId].length}`
        );
      }
    }

    console.log("Disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
