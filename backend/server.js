const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
const { userJoin, userLeave, getUsers } = require("./utils/users");

// Store whiteboard elements per room
let roomElements = {};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("userJoined", ({ name, roomId, host, presenter, userId }) => {
    socket.join(roomId);

    // Add to memory
    userJoin(socket.id, name, roomId, host, presenter);

    // Send confirmation
    socket.emit("userIsJoined", { success: true });

    // Send updated room users
    io.to(roomId).emit("roomUsers", getUsers(roomId));

    // Send existing board for THIS room
    if (!roomElements[roomId]) roomElements[roomId] = [];
    socket.emit("whiteBoardDataResponse", { elements: roomElements[roomId] });
  });

  socket.on("whiteBoardData", ({ roomId, elements }) => {
    // Update room-specific elements
    roomElements[roomId] = elements;
    socket.broadcast.to(roomId).emit("whiteBoardDataResponse", { elements: elements });
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) io.to(user.room).emit("roomUsers", getUsers(user.room));
    console.log("User Disconnected:", socket.id);
  });
});

const port = 5000;
server.listen(port, () => console.log("Server running on http://localhost:5000"));
