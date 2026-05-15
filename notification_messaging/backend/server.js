const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

let users = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // Register user with username
  socket.on("register", (username) => {
    users[socket.id] = {
      id: socket.id,
      username,
      room: null
    };

    io.emit("users", Object.values(users));
  });

  // Broadcast
  socket.on("broadcast", (msg) => {
    io.emit("message", {
      from: users[socket.id]?.username,
      text: msg,
      type: "broadcast"
    });
  });

  // Private
  socket.on("private_message", ({ to, message }) => {
    io.to(to).emit("message", {
      from: users[socket.id]?.username,
      text: message,
      type: "private"
    });
  });

  // Join room
  socket.on("join_room", (room) => {
    socket.join(room);
    users[socket.id].room = room;

    socket.to(room).emit("message", {
      from: "system",
      text: `${users[socket.id].username} joined ${room}`,
      type: "room"
    });
  });

  // Leave room
  socket.on("leave_room", (room) => {
    socket.leave(room);
    users[socket.id].room = null;

    socket.to(room).emit("message", {
      from: "system",
      text: `${users[socket.id].username} left ${room}`,
      type: "room"
    });
  });

  // Room message
  socket.on("room_message", ({ room, message }) => {
    io.to(room).emit("message", {
      from: users[socket.id]?.username,
      text: message,
      type: "room"
    });
  });

  // Typing
  socket.on("typing", (room) => {
    socket.to(room).emit("typing", users[socket.id]?.username);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    delete users[socket.id];
    io.emit("users", Object.values(users));
  });
});

server.listen(3001, () => {
  console.log("Server running on 3001");
});