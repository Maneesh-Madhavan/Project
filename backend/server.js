const express = require("express");
const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "*" }
});

// import user functions
const { userJoin, userLeave, getUsers } = require("./utils//users");

let imgURLGlobal = null;

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // User joins room
  socket.on("userJoined", ({ roomId, username, host, presenter }) => {
    socket.join(roomId);

    // add to memory
    userJoin(socket.id, username, roomId, host, presenter);

    // send confirmation
    socket.emit("userIsJoined", { success: true });

    // send updated users list to room
    const roomUsers = getUsers(roomId);
    io.to(roomId).emit("roomUsers", roomUsers);

    // send existing board to new user
    socket.broadcast.to(roomId).emit("whiteBoardDataResponse", {
      imgURL: imgURLGlobal
    });
  });

  // receive whiteboard data
  socket.on("whiteboardData", (data) => {
    imgURLGlobal = data;
    // broadcast to all in room except sender
    socket.broadcast.emit("whiteBoardDataResponse", { imgURL: data });
  });

  // user disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      const roomUsers = getUsers(user.room);
      io.to(user.room).emit("roomUsers", roomUsers);
    }
    console.log("User Disconnected:", socket.id);
  });

});

const port = 5000;
server.listen(port, () => console.log("Server running on http://localhost:5000"));
