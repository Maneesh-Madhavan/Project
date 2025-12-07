const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });
const { userJoin, userLeave, getUsers } = require("./utils/users");

let elementsGlobal = []; // store whiteboard elements

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("userJoined", ({ name, roomId, host, presenter, userId }) => {
    socket.join(roomId);

    // add to memory
    userJoin(socket.id, name, roomId, host, presenter);

    // confirmation
    socket.emit("userIsJoined", { success: true });

    // send updated room users
    io.to(roomId).emit("roomUsers", getUsers(roomId));

    // send existing board to new user
    socket.emit("whiteBoardDataResponse", { elements: elementsGlobal });
  });

  socket.on("whiteBoardData", ({ elements }) => {
    elementsGlobal = elements;
    socket.broadcast.emit("whiteBoardDataResponse", { elements: elementsGlobal });
  });

  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) io.to(user.room).emit("roomUsers", getUsers(user.room));
    console.log("User Disconnected:", socket.id);
  });
});

const port = 5000;
server.listen(port, () => console.log("Server running on http://localhost:5000"));
